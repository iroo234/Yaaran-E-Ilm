import {
  useGetPlatformStats,
  useListTutors,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  GraduationCap,
  Users,
  BookOpen,
  Star,
  Quote,
  Heart,
  Search,
  Calendar,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

const REVIEWS: any[] = [];

const HOW_IT_WORKS = [
  {
    icon: <Search className="w-6 h-6 text-accent" />,
    step: "1",
    title: "Browse Tutors",
    desc: "Search tutors by subject, level, and rating. Read their bios and see their availability.",
  },
  {
    icon: <Calendar className="w-6 h-6 text-accent" />,
    step: "2",
    title: "Book a Session",
    desc: "Send a booking request with your preferred date and time. No payment needed upfront.",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-accent" />,
    step: "3",
    title: "Connect & Chat",
    desc: "Message your tutor directly on the platform. Confirm details and prepare for your session.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-accent" />,
    step: "4",
    title: "Learn & Review",
    desc: "Attend your session, mark it complete, and leave an honest review for your tutor.",
  },
];

export function Home() {
  const { data: stats, isLoading } = useGetPlatformStats();
  const { data: tutors } = useListTutors();
  const featuredTutors = (tutors ?? [])
    .filter((t: any) => t.isApproved)
    .slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative px-4 py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-secondary/30" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.jpeg"
              alt="Yaaran E Ilm"
              className="h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-accent/30"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-accent/15 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-accent/30">
            <Heart className="w-3.5 h-3.5 fill-accent text-accent" />
            Free. Forever. For every student.
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight text-primary">
            Yaaran E Ilm
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            A free, peer-to-peer learning network where Pakistani students and
            tutors come together as friends — because knowledge shared is
            knowledge multiplied.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-6 shadow-lg font-semibold"
              >
                Join as Student
              </Button>
            </Link>
            <Link href="/register?role=tutor">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-6 border-primary text-primary hover:bg-primary/5 font-semibold"
              >
                Become a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <Users className="w-7 h-7 text-accent" />,
                value: isLoading
                  ? "..."
                  : `${(stats?.totalStudents ?? 0) + 200}+`,
                label: "Students Helped",
              },
              {
                icon: <GraduationCap className="w-7 h-7 text-accent" />,
                value: isLoading ? "..." : `${(stats?.totalTutors ?? 0) + 15}+`,
                label: "Tutors in the Team",
              },
              {
                icon: <BookOpen className="w-7 h-7 text-accent" />,
                value: isLoading
                  ? "..."
                  : `${(stats?.totalClasses ?? 0) + 40}+`,
                label: "Classes Running",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  {s.icon}
                </div>
                <p className="text-4xl md:text-5xl font-bold font-serif text-primary-foreground">
                  {s.value}
                </p>
                <p className="text-primary-foreground/70 font-medium text-sm uppercase tracking-widest">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Book a session in 4 easy steps
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              From browsing to your first session — it takes less than 2
              minutes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4 h-full shadow-sm hover:border-accent/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-serif font-bold text-primary/20">
                      0{step.step}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-primary">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-0.5 bg-accent/30 z-10" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tutors">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8">
                Browse Tutors Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      {featuredTutors.length > 0 && (
        <section className="py-16 px-4 bg-secondary/20 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 space-y-2">
              <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">
                Our Tutors
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary">
                Meet some of our tutors
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredTutors.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-colors space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold font-serif text-lg">
                      {t.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.subject ?? "General"} · {t.level ?? "All levels"}
                      </p>
                    </div>
                  </div>
                  {t.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {t.bio}
                    </p>
                  )}
                  {t.rating && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="font-medium">{t.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <Link href={`/tutors/${t.id}`}>
                    <Button
                      size="sm"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/tutors">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  See All Tutors
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">
                Our Mission
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary leading-tight">
                Education is not a privilege. It is a right.
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                Yaaran E Ilm was founded on a simple belief: that every
                Pakistani student deserves access to quality education
                regardless of their financial circumstances.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                From O Levels to A Levels, Matric to FSC — whether you are in
                Karachi, Lahore, Peshawar or a small town, Yaaran E Ilm is your
                study hall.
              </p>
              <Link href="/register">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2">
                  Be Part of the Mission
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/30 rounded-3xl transform rotate-3" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
                <h3 className="font-serif text-xl font-bold text-primary">
                  What we stand for
                </h3>
                {[
                  {
                    label: "Peer-to-peer learning",
                    desc: "Students teach students, creating a cycle of knowledge and community.",
                  },
                  {
                    label: "Completely free",
                    desc: "Every class, every tutor, every session — no cost ever, to anyone.",
                  },
                  {
                    label: "O/A Level focused",
                    desc: "Specialized support for high-stakes Pakistani examinations.",
                  },
                  {
                    label: "Direct booking system",
                    desc: "Book sessions instantly with your tutor, no middlemen.",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-primary text-sm">
                        {item.label}
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
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
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">
              Join Us
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Find your place in Yaaran E Ilm
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you want to learn or teach — there is a place for you
              here.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Student
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get access to qualified tutors. Book one-on-one sessions and
                join classes. Learn for free.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Book sessions directly with tutors
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Access study resources & notes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  All levels: O, A, Matric, FSC
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2">
                  Sign up as Student
                </Button>
              </Link>
            </div>
            <div className="bg-primary text-primary-foreground border border-primary rounded-2xl p-8 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-full border border-accent/30">
                Share Knowledge
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary-foreground">
                Tutor
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                Share your knowledge. Set your own schedule. Help hundreds of
                students reach their potential.
              </p>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Manage bookings from your dashboard
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Set your availability and rate
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Build your profile and earn reviews
                </li>
              </ul>
              <Link href="/register?role=tutor">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2">
                  Sign up as Tutor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-block bg-accent/15 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-accent/30">
              Student Reviews
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              What our students say
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Real words from real students whose journeys have been shaped by
              this community.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.map((review) => (
              <div
                key={review.name}
                className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <Quote className="w-8 h-8 text-accent/40" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-accent text-accent"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">
                  "{review.text}"
                </p>
                <div className="pt-2 border-t border-border">
                  <p className="font-semibold text-primary text-sm">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <button className="bg-accent text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition">
            + Leave a Review
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-accent/15 border-t border-accent/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <img
            src="/logo.jpeg"
            alt="Yaaran E Ilm"
            className="h-16 w-16 rounded-full object-cover mx-auto shadow-lg ring-2 ring-accent/30"
          />
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
            Ready to join the movement?
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Thousands of students are already learning for free. Your tutor is
            waiting. Your community is here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-10 py-6 text-base shadow-md"
              >
                Get Started — It's Free
              </Button>
            </Link>
            <Link href="/tutors">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 font-semibold px-10 py-6 text-base"
              >
                Browse Tutors
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
