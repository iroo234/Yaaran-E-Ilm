import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Heart, Star, Code, BookOpen, Megaphone, GraduationCap } from "lucide-react";

type TeamMember = {
  name: string;
  role: string;
  department: string;
  bio: string;
  icon: React.ReactNode;
  initial: string;
  color: string;
};

const FOUNDERS: TeamMember[] = [
  {
    name: "M. Irfan Zaidi",
    role: "Founder & Lead Developer",
    department: "Founding Team",
    bio: "Built Yaaran E Ilm from the ground up with a vision to make quality education free and accessible for every student across Pakistan. Passionate about technology and its power to bridge the education gap.",
    icon: <Code className="w-5 h-5" />,
    initial: "IZ",
    color: "bg-accent/20 text-accent",
  },
  {
    name: "Co-Founder",
    role: "Co-Founder & Academic Director",
    department: "Founding Team",
    bio: "Leads the academic vision and curriculum standards at Yaaran E Ilm. Ensures that every tutor on the platform meets the highest quality of teaching standards for O/A Level students.",
    icon: <GraduationCap className="w-5 h-5" />,
    initial: "AD",
    color: "bg-rose-100 text-rose-700",
  },
];

const DEPARTMENT_HEADS: TeamMember[] = [
  {
    name: "Head of Outreach",
    role: "Student Outreach Lead",
    department: "Outreach",
    bio: "Manages relationships with schools and student communities across Pakistan. Responsible for growing the YEI family and connecting students with the right tutors.",
    icon: <Megaphone className="w-5 h-5" />,
    initial: "OL",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Head of Content",
    role: "Content & Resources Lead",
    department: "Content",
    bio: "Oversees all educational content on the platform — from video uploads to study resources. Ensures every resource on YEI is high quality, relevant, and exam-ready.",
    icon: <BookOpen className="w-5 h-5" />,
    initial: "CL",
    color: "bg-sky-100 text-sky-700",
  },
  {
    name: "Head of Community",
    role: "Community & Volunteer Manager",
    department: "Community",
    bio: "Builds and nurtures the YEI volunteer network. Organises team events, manages onboarding for new team members, and keeps the YEI family motivated and connected.",
    icon: <Heart className="w-5 h-5" />,
    initial: "CM",
    color: "bg-pink-100 text-pink-700",
  },
  {
    name: "Head of Tutors",
    role: "Tutor Relations Lead",
    department: "Tutors",
    bio: "Works closely with tutors to ensure they have everything they need to teach effectively. Handles tutor approvals, quality reviews, and keeps the tutor community thriving.",
    icon: <Star className="w-5 h-5" />,
    initial: "TR",
    color: "bg-violet-100 text-violet-700",
  },
];

function MemberCard({ member, delay }: { member: TeamMember; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-accent/30 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-serif font-bold text-lg ${member.color} group-hover:scale-105 transition-transform`}>
          {member.initial}
        </div>
        <div className="min-w-0">
          <p className="font-serif font-bold text-primary text-base leading-tight">{member.name}</p>
          <p className="text-sm font-semibold text-accent mt-0.5">{member.role}</p>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 mt-1">
            {member.icon}{member.department}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
    </motion.div>
  );
}

export function Team() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold !text-white mb-3">Meet Our Team</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed">
              Yaaran E Ilm is built and run by a passionate volunteer team dedicated to making quality education free for every student in Pakistan.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-14">

        {/* Values */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-accent/10 border border-accent/20 rounded-2xl p-6 text-center space-y-2">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider">Our Mission</p>
          <p className="font-serif text-xl font-bold text-primary max-w-2xl mx-auto">
            "Free. Always. For every student in Pakistan."
          </p>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">Every member of our team volunteers their time and skills because they believe education changes lives. We're all یاران علم — companions in knowledge.</p>
        </motion.div>

        {/* Founders */}
        <section>
          <div className="mb-7">
            <h2 className="font-serif text-2xl font-bold text-primary">Founders</h2>
            <p className="text-muted-foreground text-sm mt-1">The people who started it all</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FOUNDERS.map((m, i) => <MemberCard key={m.name} member={m} delay={i * 0.1} />)}
          </div>
        </section>

        {/* Department Heads */}
        <section>
          <div className="mb-7">
            <h2 className="font-serif text-2xl font-bold text-primary">Department Heads</h2>
            <p className="text-muted-foreground text-sm mt-1">Leading each pillar of the platform</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {DEPARTMENT_HEADS.map((m, i) => <MemberCard key={m.name} member={m} delay={i * 0.1} />)}
          </div>
        </section>

        {/* Join CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-10 text-center space-y-5">
          <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 text-accent" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-bold text-primary">Want to join our team?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">We're always looking for passionate volunteers — whether you're into teaching, content, outreach, or technology. Make a difference with us.</p>
          </div>
          <Link href="/register?role=team">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.03] transition-all font-semibold px-8 gap-2">
              <Users className="w-4 h-4" />Apply to Join
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
