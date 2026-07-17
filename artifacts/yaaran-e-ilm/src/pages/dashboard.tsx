import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle, XCircle, Star, BookOpen, MessageSquare, Users, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Booking = {
  id: number; studentId: number; tutorId: number; subject: string; message?: string;
  date: string; timeSlot: string; status: string; hourlyRate: string;
  studentName: string; tutorName: string; tutorProfileId?: number; hasReview: boolean; createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    reviewed: "bg-purple-100 text-purple-700 border-purple-200",
    declined: "bg-red-100 text-red-700 border-red-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function ReviewModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/reviews", { method: "POST", body: JSON.stringify({ bookingId: booking.id, rating, comment }) }),
    onSuccess: () => { toast({ title: "Review submitted! ⭐" }); qc.invalidateQueries({ queryKey: ["my-bookings"] }); onClose(); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold text-primary">Rate session with {booking.tutorName}</h3>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience (optional)..." className="w-full border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-background text-foreground" />
        <div className="flex gap-2">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">{mutation.isPending ? "Submitting..." : "Submit Review"}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => apiFetch("/api/bookings/my"),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/bookings/${id}/accept`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Booking accepted!" }); qc.invalidateQueries({ queryKey: ["my-bookings"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const declineMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/bookings/${id}/decline`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Booking declined" }); qc.invalidateQueries({ queryKey: ["my-bookings"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });
  const completeMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/bookings/${id}/complete`, { method: "POST" }),
    onSuccess: (_, id) => {
      toast({ title: "Session marked complete!" });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      const b = bookings.find(x => x.id === id);
      if (b && !user?.role?.includes("tutor")) setReviewBooking(b);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;
  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      <Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link>
    </div>
  );

  const isTutor = user.role === "tutor";
  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  const completed = bookings.filter(b => b.status === "completed");
  const history = bookings.filter(b => ["reviewed", "declined"].includes(b.status));

  return (
    <div className="min-h-screen bg-background">
      {reviewBooking && <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} />}

      {/* Hero header — explicit foreground colors to prevent global h1 color from hiding text */}
      <div className="bg-primary px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1 !text-primary-foreground">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-primary-foreground/70 text-sm capitalize">{isTutor ? "Tutor Dashboard" : "Student Dashboard"}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Pending", value: pending.length, icon: <Clock className="w-4 h-4 text-yellow-300" /> },
              { label: "Confirmed", value: confirmed.length, icon: <CheckCircle className="w-4 h-4 text-blue-300" /> },
              { label: "Completed", value: completed.length + history.filter(b=>b.status==="reviewed").length, icon: <Star className="w-4 h-4 text-green-300" /> },
              { label: "Total Sessions", value: bookings.length, icon: <Users className="w-4 h-4 text-accent" /> },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
                {s.icon}
                <div>
                  <p className="text-xl font-bold font-serif text-white">{s.value}</p>
                  <p className="text-xs text-white/60">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Pending */}
        {pending.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-yellow-500" />{isTutor ? "Awaiting Your Response" : "Pending Requests"}</h2>
            <div className="space-y-3">
              {pending.map(b => (
                <div key={b.id} className="bg-card border border-yellow-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary">{isTutor ? b.studentName : b.tutorName}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{b.subject} · {b.date} at {b.timeSlot}</p>
                      {b.message && <p className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-2">"{b.message}"</p>}
                      <p className="text-xs font-medium text-primary/70">Rate: {b.hourlyRate === "free" ? "Free" : `PKR ${b.hourlyRate}/hr`}</p>
                    </div>
                    {isTutor && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => acceptMutation.mutate(b.id)} disabled={acceptMutation.isPending}><CheckCircle className="w-3.5 h-3.5" />Accept</Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5 gap-1" onClick={() => declineMutation.mutate(b.id)} disabled={declineMutation.isPending}><XCircle className="w-3.5 h-3.5" />Decline</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Confirmed */}
        {confirmed.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" />Upcoming Sessions</h2>
            <div className="space-y-3">
              {confirmed.map(b => (
                <div key={b.id} className="bg-card border border-blue-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary">{isTutor ? b.studentName : b.tutorName}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{b.subject} · {b.date} at {b.timeSlot}</p>
                      <p className="text-xs font-medium text-primary/70">Rate: {b.hourlyRate === "free" ? "Free" : `PKR ${b.hourlyRate}/hr`}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/messages?with=${isTutor ? b.studentId : b.tutorId}`}>
                        <Button size="sm" variant="outline" className="gap-1"><MessageSquare className="w-3.5 h-3.5" />Message</Button>
                      </Link>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => completeMutation.mutate(b.id)} disabled={completeMutation.isPending}><CheckCircle className="w-3.5 h-3.5" />Mark Complete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Need review */}
        {!isTutor && completed.filter(b => !b.hasReview).length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Leave a Review</h2>
            <div className="space-y-3">
              {completed.filter(b => !b.hasReview).map(b => (
                <div key={b.id} className="bg-card border border-green-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-primary">{b.tutorName}</span>
                    <p className="text-sm text-muted-foreground">{b.subject} · {b.date}</p>
                  </div>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1" onClick={() => setReviewBooking(b)}><Star className="w-3.5 h-3.5" />Leave Review</Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-muted-foreground" />Session History</h2>
            <div className="space-y-2">
              {history.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-primary text-sm">{isTutor ? b.studentName : b.tutorName}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{b.subject} · {b.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {bookings.length === 0 && !bookingsLoading && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-serif text-xl font-bold text-primary">{isTutor ? "No bookings yet" : "Start your learning journey"}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{isTutor ? "Students will book sessions once your profile is live." : "Browse our tutors and book your first free session."}</p>
            {!isTutor && <Link href="/tutors"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Browse Tutors</Button></Link>}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/messages"><div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-accent/40 cursor-pointer transition-colors"><MessageSquare className="w-5 h-5 text-accent" /><span className="font-medium text-sm text-primary">Messages</span></div></Link>
          <Link href="/resources"><div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-accent/40 cursor-pointer transition-colors"><BookOpen className="w-5 h-5 text-accent" /><span className="font-medium text-sm text-primary">Resources</span></div></Link>
          <Link href="/tutors"><div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-accent/40 cursor-pointer transition-colors"><Users className="w-5 h-5 text-accent" /><span className="font-medium text-sm text-primary">Find Tutors</span></div></Link>
        </div>
      </div>
    </div>
  );
}
