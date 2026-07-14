import { useState } from "react";
import { useParams } from "wouter";
import { useGetTutor, useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Users, BookOpen, Calendar, Clock, MessageSquare, Send, Pencil, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Slot = { id: number; dayOfWeek: string; startTime: string; endTime: string; };
type Review = { id: number; rating: number; comment?: string; studentName: string; createdAt: string; };

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics"];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none">
          <span className={(hover || value) >= s ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function TutorDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tutor, isLoading } = useGetTutor(parseInt(id));
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showBooking, setShowBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [bookingForm, setBookingForm] = useState({ subject: "", date: "", timeSlot: "", message: "" });

  const { data: slots = [] } = useQuery<Slot[]>({
    queryKey: ["availability", tutor?.userId],
    queryFn: () => apiFetch(`/api/availability/${tutor?.userId}`),
    enabled: !!tutor?.userId,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery<Review[]>({
    queryKey: ["reviews", tutor?.userId],
    queryFn: () => apiFetch(`/api/reviews/tutor/${tutor?.userId}`),
    enabled: !!tutor?.userId,
  });

  const bookingMutation = useMutation({
    mutationFn: () => apiFetch("/api/bookings", { method: "POST", body: JSON.stringify({ tutorId: parseInt(id), ...bookingForm }) }),
    onSuccess: () => { toast({ title: "Booking request sent! 🎉", description: "The tutor will respond soon." }); setShowBooking(false); setLocation("/dashboard"); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const messageMutation = useMutation({
    mutationFn: () => apiFetch("/api/messages", { method: "POST", body: JSON.stringify({ receiverId: tutor?.userId, content: `Hi! I found your profile on Yaaran E Ilm and would like to connect.` }) }),
    onSuccess: () => { toast({ title: "Message sent!" }); setLocation(`/messages?with=${tutor?.userId}`); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => apiFetch("/api/reviews", { method: "POST", body: JSON.stringify({ tutorUserId: tutor?.userId, rating: reviewRating, comment: reviewComment || undefined }) }),
    onSuccess: () => {
      toast({ title: "Review submitted! ⭐", description: "Thank you for your feedback." });
      setShowReview(false); setReviewRating(0); setReviewComment("");
      refetchReviews(); qc.invalidateQueries({ queryKey: ["reviews", tutor?.userId] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!tutor) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
      <Users className="w-12 h-12 text-muted-foreground/30" />
      <p className="text-lg font-medium text-primary">Tutor profile not available</p>
      <p className="text-sm">This tutor may be pending approval or has been removed.</p>
      <Link href="/tutors"><Button variant="outline">Browse Other Tutors</Button></Link>
    </div>
  );

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const initials = tutor.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase() ?? "T";
  const isOwnProfile = user && (user as any).id === tutor.userId;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-accent/20">
              <AvatarImage src={tutor.avatarUrl ?? ""} className="object-cover" />
              <AvatarFallback className="text-2xl font-serif bg-accent/20 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary">{tutor.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {tutor.subject && <span className="text-sm bg-accent/15 text-primary px-3 py-1 rounded-full font-medium">{tutor.subject}</span>}
                {tutor.level && <span className="text-sm bg-secondary text-primary px-3 py-1 rounded-full border border-border">{tutor.level}</span>}
              </div>
            </div>
            {tutor.bio && <p className="text-muted-foreground leading-relaxed">{tutor.bio}</p>}
            <div className="flex flex-wrap gap-4 text-sm">
              {avgRating !== null && (
                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400" />{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" />{tutor.totalStudents ?? 0} students</div>
              <div className="flex items-center gap-1 text-muted-foreground"><BookOpen className="w-4 h-4" />{tutor.totalClasses ?? 0} classes</div>
            </div>
          </div>
        </div>

        {user && !isOwnProfile && (
          <div className="mt-6 flex flex-wrap gap-3">
            {user.role !== "tutor" && (
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all gap-2 shadow-sm" onClick={() => setShowBooking(!showBooking)}>
                <Calendar className="w-4 h-4" />Book a Session
              </Button>
            )}
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all gap-2 shadow-sm" onClick={() => messageMutation.mutate()} disabled={messageMutation.isPending}>
              <MessageSquare className="w-4 h-4" />{messageMutation.isPending ? "Opening..." : "Chat with Tutor"}
            </Button>
            <Button variant="outline" className="gap-2 border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:scale-[1.02] transition-all" onClick={() => setShowReview(!showReview)}>
              <Star className="w-4 h-4 fill-yellow-400" />Leave a Review
            </Button>
          </div>
        )}
        {!user && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"><MessageSquare className="w-4 h-4" />Log in to Chat</Button></Link>
            <Link href="/login"><Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" />Log in to Book</Button></Link>
            <Link href="/login"><Button variant="outline" className="gap-2 border-yellow-300 text-yellow-600"><Star className="w-4 h-4" />Log in to Review</Button></Link>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReview && user && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-yellow-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Pencil className="w-5 h-5 text-yellow-500" />Leave a Review for {tutor.name}</h2>
              <button onClick={() => setShowReview(false)} className="text-muted-foreground hover:text-primary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <Label>Your Rating *</Label>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="space-y-1.5">
              <Label>Comment (optional)</Label>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience with this tutor..." className="w-full border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-yellow-300/50 bg-background text-primary" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => reviewMutation.mutate()} disabled={reviewRating === 0 || reviewMutation.isPending} className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2 hover:scale-[1.02] transition-all">
                <Star className="w-4 h-4" />{reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
              <Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Form */}
      <AnimatePresence>
        {showBooking && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-accent/20 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" />Book a Session with {tutor.name}</h2>
              <button onClick={() => setShowBooking(false)} className="text-muted-foreground hover:text-primary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <select value={bookingForm.subject} onChange={e => setBookingForm(f => ({...f, subject: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                  <option value="">Select subject...</option>
                  {tutor.subject ? <option value={tutor.subject}>{tutor.subject}</option> : SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={bookingForm.date} onChange={e => setBookingForm(f => ({...f, date: e.target.value}))} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label>Time Slot *</Label>
                {slots.length > 0 ? (
                  <select value={bookingForm.timeSlot} onChange={e => setBookingForm(f => ({...f, timeSlot: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                    <option value="">Select a slot...</option>
                    {slots.map(s => <option key={s.id} value={`${s.startTime}–${s.endTime}`}>{s.dayOfWeek}: {s.startTime}–{s.endTime}</option>)}
                  </select>
                ) : (
                  <Input placeholder="e.g., 4:00 PM – 5:00 PM" value={bookingForm.timeSlot} onChange={e => setBookingForm(f => ({...f, timeSlot: e.target.value}))} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Message (optional)</Label>
                <Input placeholder="What do you need help with?" value={bookingForm.message} onChange={e => setBookingForm(f => ({...f, message: e.target.value}))} />
              </div>
            </div>
            <div className="bg-muted/30 border border-border rounded-xl p-3 text-sm text-muted-foreground">
              <strong className="text-primary">Rate:</strong> {(tutor as any).hourlyRate === "free" || !(tutor as any).hourlyRate ? "Free" : `PKR ${(tutor as any).hourlyRate}/hr`}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => bookingMutation.mutate()} disabled={bookingMutation.isPending || !bookingForm.subject || !bookingForm.date || !bookingForm.timeSlot} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 hover:scale-[1.02] transition-all">
                <Send className="w-4 h-4" />{bookingMutation.isPending ? "Sending..." : "Send Booking Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowBooking(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Availability */}
      {slots.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Clock className="w-5 h-5 text-accent" />Availability</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {slots.map(s => (
              <div key={s.id} className="bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm">
                <p className="font-medium text-primary">{s.dayOfWeek}</p>
                <p className="text-muted-foreground">{s.startTime}–{s.endTime}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />Reviews
            {reviews.length > 0 && <span className="text-base font-normal text-muted-foreground">({reviews.length})</span>}
          </h2>
          {user && !isOwnProfile && (
            <Button size="sm" variant="outline" className="gap-1.5 border-yellow-300 text-yellow-600 hover:bg-yellow-50 text-xs" onClick={() => setShowReview(true)}>
              <Pencil className="w-3.5 h-3.5" />Write a Review
            </Button>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Star className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first to leave one!</p>
            {user && !isOwnProfile && <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1.5 mt-2" onClick={() => setShowReview(true)}><Star className="w-3.5 h-3.5" />Leave First Review</Button>}
          </div>
        ) : reviews.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border-b border-border last:border-0 pb-4 last:pb-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary text-sm">{r.studentName}</span>
              <div className="flex text-yellow-400 text-sm">
                {"★".repeat(Math.round(r.rating))}{"☆".repeat(5 - Math.round(r.rating))}
                <span className="text-xs text-muted-foreground ml-1.5">({r.rating}/5)</span>
              </div>
            </div>
            {r.comment && <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>}
            <p className="text-xs text-primary/30">{new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
