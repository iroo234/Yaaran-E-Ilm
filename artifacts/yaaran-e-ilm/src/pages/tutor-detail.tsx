import { useState } from "react";
import { useParams } from "wouter";
import { useGetTutor, useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Users, BookOpen, Calendar, Clock, MessageSquare, Send } from "lucide-react";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Slot = { id: number; dayOfWeek: string; startTime: string; endTime: string; };
type Review = { id: number; rating: number; comment?: string; studentName: string; createdAt: string; };

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics"];

export function TutorDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tutor, isLoading } = useGetTutor({ id: parseInt(id) });
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ subject: "", date: "", timeSlot: "", message: "" });

  const { data: slots = [] } = useQuery<Slot[]>({
    queryKey: ["availability", tutor?.userId],
    queryFn: () => apiFetch(`/api/availability/${tutor?.userId}`),
    enabled: !!tutor?.userId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
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

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;
  if (!tutor) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Tutor not found.</div>;

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const initials = tutor.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase() ?? "T";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-accent/20">
              <AvatarImage src={tutor.avatarUrl ?? ""} />
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
              {avgRating && (
                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400" />{avgRating.toFixed(1)} ({reviews.length} reviews)
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" />{tutor.totalStudents ?? 0} students</div>
              <div className="flex items-center gap-1 text-muted-foreground"><BookOpen className="w-4 h-4" />{tutor.totalClasses ?? 0} classes</div>
            </div>
          </div>
        </div>

        {user && user.role !== "tutor" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => setShowBooking(true)}>
              <Calendar className="w-4 h-4" />Book a Session
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => messageMutation.mutate()} disabled={messageMutation.isPending}>
              <MessageSquare className="w-4 h-4" />Message
            </Button>
          </div>
        )}
        {!user && (
          <div className="mt-6">
            <Link href="/login"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"><Calendar className="w-4 h-4" />Log in to Book</Button></Link>
          </div>
        )}
      </div>

      {/* Booking Form */}
      {showBooking && (
        <div className="bg-card border border-accent/20 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" />Book a Session with {tutor.name}</h2>
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
            <Button onClick={() => bookingMutation.mutate()} disabled={bookingMutation.isPending || !bookingForm.subject || !bookingForm.date || !bookingForm.timeSlot} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Send className="w-4 h-4" />{bookingMutation.isPending ? "Sending..." : "Send Booking Request"}
            </Button>
            <Button variant="outline" onClick={() => setShowBooking(false)}>Cancel</Button>
          </div>
        </div>
      )}

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
        <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Star className="w-5 h-5 text-accent" />Reviews {reviews.length > 0 && <span className="text-base font-normal text-muted-foreground">({reviews.length})</span>}</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to book a session!</p>
        ) : reviews.map(r => (
          <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary text-sm">{r.studentName}</span>
              <div className="flex text-yellow-400">{"★".repeat(Math.round(r.rating))}{"☆".repeat(5-Math.round(r.rating))}</div>
            </div>
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            <p className="text-xs text-primary/30">{new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
