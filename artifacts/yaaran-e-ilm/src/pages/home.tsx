import { useState } from "react";
import { useGetPlatformStats, useListTutors, useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Users, BookOpen, Star, Quote,
  Heart, Search, Calendar, CheckCircle, MessageSquare, X,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Review = { id: number; studentName: string; tutorName: string; rating: number; comment?: string; };
type Tutor = { id: number; userId: number; name: string; subject?: string; };

const FEATURED_TESTIMONIALS = [
  {
    id: "t1",
    name: "Fabiha Munir",
    role: "O3 Level · Chemistry",
    stars: 5,
    text: "My experience has honestly been amazing! Since I'm taught separately, I get full attention, which really helps me understand everything deeply. The tutor is incredibly supportive, cooperative, and explains concepts in such a clear and friendly way. It feels like a very comfortable and positive learning space, and I genuinely enjoy every class. Really grateful for such a great experience! ✨",
  },
  {
    id: "t2",
    name: "Ibrahim",
    role: "Grade 6 · Algebra",
    stars: 5,
    text: "The class went really well! The tutor was very understanding and explained difficult as well as basic level concepts really well. She made sure to speak in a way that would help the student grasp what she's saying and overall made the student feel very comfortable to ask any question. She was very well prepared and was very open to any feedback. Overall amazing experience — will definitely be continuing! ✨",
  },
  {
    id: "t3",
    name: "YEI Student",
    role: "Yaaran E Ilm",
    stars: 5,
    text: "Honestly, everything is already really well-managed, and I'm completely satisfied with my learning experience. I don't feel there's anything that needs improvement at the moment. Keep up the great work! ✨",
  },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          className="text-3xl transition-transform hover:scale-125 focus:outline-none">
          <span className={(hover || value) >= s ? "text-yellow-400" : "text-muted-foreground/20"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: tutors } = useListTutors();
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ tutorUserId: "", rating: 0, comment: "" });

  const { data: content = {} } = useQuery<Record<string, string>>({
    queryKey: ["site-content"],
    queryFn: () => apiFetch("/api/content"),
    staleTime: 60_000,
  });
  const c = (key: string, fallback = "") => content[key] ?? fallback;

  const { data: reviews = [], refetch: refetchReviews } = useQuery<Review[]>({
    queryKey: ["homepage-reviews"],
    queryFn: () => apiFetch("/api/reviews?limit=9"),
    staleTime: 30_000,
  });

  const approvedTutors = ((tutors ?? []) as any[]).filter((t: any) => t.isApproved);
  const featuredTutors = approvedTutors.slice(0, 3);

  const reviewMutation = useMutation({
    mutationFn: () => apiFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ tutorUserId: parseInt(reviewForm.tutorUserId, 10), rating: reviewForm.rating, comment: reviewForm.comment || undefined }),
    }),
    onSuccess: () => {
      toast({ title: "Review submitted! ⭐", description: "Your review has been saved." });
      setShowReviewModal(false);
      setReviewForm({ tutorUserId: "", rating: 0, comment: "" });
      refetchReviews();
      qc.invalidateQueries({ queryKey: ["homepage-reviews"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not submit review", description: e.message }),
  });

  const HOW_IT_WORKS = [
    { icon: <Search className="w-6 h-6 text-accent" />, step: "1", title: c("hiw_1_title", "Browse Tutors"), desc: c("hiw_1_desc", "Search tutors by subject, level, and rating. Read their bios and see their availability.") },
    { icon: <Calendar className="w-6 h-6 text-accent" />, step: "2", title: c("hiw_2_title", "Book a Session"), desc: c("hiw_2_desc", "Send a booking request with your preferred date and time. No payment needed upfront.") },
    { icon: <MessageSquare className="w-6 h-6 text-accent" />, step: "3", title: c("hiw_3_title", "Connect & Chat"), desc: c("hiw_3_desc", "Message your tutor directly on the platform. Confirm details and prepare for your session.") },
    { icon: <CheckCircle className="w-6 h-6 text-accent" />, step: "4", title: c("hiw_4_title", "Learn & Review"), desc: c("hiw_4_desc", "Attend your session, mark it complete, and leave an honest review for your tutor.") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative px-4 py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-secondary/30" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl -translate-x-1/2 translate-y-1/2" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.jpeg" alt="Yaaran E Ilm" className="h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-accent/30" />
          </div>
          <div className="inline-flex items-center gap-2 bg-accent/15 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-accent/30">
            <Heart className="w-3.5 h-3.5 fill-accent text-accent" />{c("hero_badge", "Free. Forever. For every student.")}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight text-primary">{c("hero_title", "Yaaran E Ilm")}</h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">{c("hero_subtitle", "A free, peer-to-peer learning network where Pakistani students and tutors come together as friends.")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register"><Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-6 shadow-lg font-semibold hover:scale-105 transition-all">{c("hero_cta_student", "Join as Student")}</Button></Link>
            <Link href="/register?role=tutor"><Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 border-primary text-primary hover:bg-primary/5 font-semibold hover:scale-105 transition-all">{c("hero_cta_tutor", "Become a Tutor")}</Button></Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Users className="w-7 h-7 text-accent" />, value: statsLoading ? "..." : `${(stats?.totalStudents ?? 0) + parseInt(c("stats_students_boost", "200"), 10)}+`, label: c("stats_students_label", "Students Helped") },
              { icon: <GraduationCap className="w-7 h-7 text-accent" />, value: statsLoading ? "..." : `${(stats?.totalTutors ?? 0) + parseInt(c("stats_tutors_boost", "15"), 10)}+`, label: c("stats_tutors_label", "Tutors in the Team") },
              { icon: <BookOpen className="w-7 h-7 text-accent" />, value: statsLoading ? "..." : `${(stats?.totalClasses ?? 0) + parseInt(c("stats_classes_boost", "40"), 10)}+`, label: c("stats_classes_label", "Classes Running") },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-2">{s.icon}</div>
                <p className="text-4xl md:text-5xl font-bold font-serif text-primary-foreground">{s.value}</p>
                <p className="text-primary-foreground/70 font-medium text-sm uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{c("hiw_heading", "Book a session in 4 easy steps")}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{c("hiw_desc", "From browsing to your first session — it takes less than 2 minutes.")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4 h-full shadow-sm hover:border-accent/40 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center">{step.icon}</div>
                    <span className="text-3xl font-serif font-bold text-primary/20">0{step.step}</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-primary">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-10 -right-3 w-6 h-0.5 bg-accent/30 z-10" />}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tutors"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 hover:scale-105 transition-all">Browse Tutors Now</Button></Link>
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      {featuredTutors.length > 0 && (
        <section className="py-16 px-4 bg-secondary/20 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 space-y-2">
              <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">Our Tutors</div>
              <h2 className="text-3xl font-serif font-bold text-primary">Meet some of our tutors</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredTutors.map((t: any) => (
                <motion.div key={t.id} whileHover={{ y: -2 }}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold font-serif text-lg">{t.name?.charAt(0)}</div>
                    <div><p className="font-semibold text-primary">{t.name}</p><p className="text-xs text-muted-foreground">{t.subject ?? "General"} · {t.level ?? "All levels"}</p></div>
                  </div>
                  {t.bio && <p className="text-sm text-muted-foreground line-clamp-2">{t.bio}</p>}
                  {t.rating && <div className="flex items-center gap-1 text-yellow-400 text-sm"><Star className="w-3.5 h-3.5 fill-yellow-400" /><span className="font-medium">{t.rating.toFixed(1)}</span></div>}
                  <Link href={`/tutors/${t.id}`}><Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">View Profile</Button></Link>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8"><Link href="/tutors"><Button variant="outline" className="border-primary text-primary hover:bg-primary/5">See All Tutors</Button></Link></div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">{c("mission_badge", "Our Mission")}</div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary leading-tight">{c("mission_heading", "Education is not a privilege. It is a right.")}</h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{c("mission_p1", "Yaaran E Ilm was founded on a simple belief: that every Pakistani student deserves access to quality education regardless of their financial circumstances.")}</p>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{c("mission_p2", "From O Levels to A Levels, Matric to FSC — whether you are in Karachi, Lahore, Peshawar or a small town, Yaaran E Ilm is your study hall.")}</p>
              <Link href="/register"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2 hover:scale-105 transition-all">{c("mission_cta", "Be Part of the Mission")}</Button></Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/30 rounded-3xl transform rotate-3" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
                <h3 className="font-serif text-xl font-bold text-primary">{c("values_heading", "What we stand for")}</h3>
                {[
                  { label: c("values_1_label", "Peer-to-peer learning"), desc: c("values_1_desc", "Students teach students, creating a cycle of knowledge and community.") },
                  { label: c("values_2_label", "Completely free"), desc: c("values_2_desc", "Every class, every tutor, every session — no cost ever, to anyone.") },
                  { label: c("values_3_label", "O/A Level focused"), desc: c("values_3_desc", "Specialized support for high-stakes Pakistani examinations.") },
                  { label: c("values_4_label", "Direct booking system"), desc: c("values_4_desc", "Book sessions instantly with your tutor, no middlemen.") },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div><p className="font-semibold text-primary text-sm">{item.label}</p><p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 px-4 bg-secondary/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">Join Us</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{c("join_heading", "Find your place in Yaaran E Ilm")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{c("join_subtitle", "Whether you want to learn or teach — there is a place for you here.")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><BookOpen className="w-6 h-6 text-accent" /></div>
              <h3 className="font-serif text-xl font-bold text-primary">{c("student_card_heading", "Student")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{c("student_card_desc", "Get access to qualified tutors. Book one-on-one sessions and join classes. Learn for free.")}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[c("student_bullet_1", "Book sessions directly with tutors"), c("student_bullet_2", "Access study resources & notes"), c("student_bullet_3", "All levels: O, A, Matric, FSC")].map(b => (
                  <li key={b} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent" />{b}</li>
                ))}
              </ul>
              <Link href="/register"><Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2">Sign up as Student</Button></Link>
            </div>
            <div className="bg-primary text-primary-foreground border border-primary rounded-2xl p-8 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-full border border-accent/30">Share Knowledge</div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-accent" /></div>
              <h3 className="font-serif text-xl font-bold text-primary-foreground">{c("tutor_card_heading", "Tutor")}</h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">{c("tutor_card_desc", "Share your knowledge. Set your own schedule. Help hundreds of students reach their potential.")}</p>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                {[c("tutor_bullet_1", "Manage bookings from your dashboard"), c("tutor_bullet_2", "Set your availability and rate"), c("tutor_bullet_3", "Build your profile and earn reviews")].map(b => (
                  <li key={b} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent" />{b}</li>
                ))}
              </ul>
              <Link href="/register?role=tutor"><Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2">Sign up as Tutor</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">Student Reviews</div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{c("reviews_heading", "What our students say")}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{c("reviews_subtitle", "Real words from real students whose journeys have been shaped by this community.")}</p>
          </div>

          {/* Featured real testimonials — always shown */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {FEATURED_TESTIMONIALS.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col">
                <div className="flex items-start justify-between">
                  <Quote className="w-8 h-8 text-accent/40 flex-shrink-0" />
                  <div className="flex gap-0.5 text-yellow-400 text-base">{"★".repeat(t.stars)}</div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="pt-3 border-t border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-primary font-bold font-serif flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional DB reviews below featured ones */}
          {reviews.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {reviews.map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                  <div className="flex items-start justify-between">
                    <Quote className="w-8 h-8 text-accent/40 flex-shrink-0" />
                    <div className="flex gap-0.5 text-yellow-400">
                      {"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}
                    </div>
                  </div>
                  {review.comment && <p className="text-muted-foreground text-sm leading-relaxed italic flex-1">"{review.comment}"</p>}
                  <div className="pt-2 border-t border-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary font-bold font-serif flex-shrink-0">
                      {review.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">{review.studentName}</p>
                      <p className="text-xs text-muted-foreground">Review for {review.tutorName}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button onClick={() => { if (!user) { setLocation("/login"); return; } setShowReviewModal(true); }}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 gap-2 hover:scale-105 transition-all shadow-sm">
              <Star className="w-4 h-4 fill-accent-foreground" />+ Leave a Review
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-accent/15 border-t border-accent/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <img src="/logo.jpeg" alt="Yaaran E Ilm" className="h-16 w-16 rounded-full object-cover mx-auto shadow-lg ring-2 ring-accent/30" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{c("cta_heading", "Ready to join the movement?")}</h2>
          <p className="text-muted-foreground text-base leading-relaxed">{c("cta_desc", "Thousands of students are already learning for free. Your tutor is waiting. Your community is here.")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-10 hover:scale-105 transition-all">Join for Free</Button></Link>
            <Link href="/tutors"><Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 font-semibold px-10 hover:scale-105 transition-all">Browse Tutors</Button></Link>
          </div>
        </div>
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowReviewModal(false); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />Leave a Review</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Your feedback helps other students</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-muted-foreground hover:text-primary transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary">Select a Tutor *</label>
                <select value={reviewForm.tutorUserId} onChange={e => setReviewForm(f => ({ ...f, tutorUserId: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                  <option value="">Choose a tutor...</option>
                  {approvedTutors.map((t: any) => (
                    <option key={t.userId} value={t.userId}>{t.name} — {t.subject ?? "General"}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary">Your Rating *</label>
                <StarPicker value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                {reviewForm.rating > 0 && (
                  <p className="text-xs text-muted-foreground">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewForm.rating]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-primary">Your Comment (optional)</label>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="How was your experience with this tutor? Help other students by sharing your honest review..."
                  className="w-full border border-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-background text-primary" />
              </div>

              <div className="flex gap-3 pt-1">
                <Button onClick={() => reviewMutation.mutate()}
                  disabled={!reviewForm.tutorUserId || reviewForm.rating === 0 || reviewMutation.isPending}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white gap-2 font-semibold hover:scale-[1.02] transition-all">
                  <Star className="w-4 h-4" />{reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setShowReviewModal(false)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
