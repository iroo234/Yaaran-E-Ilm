import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Users, BookOpen, Star } from "lucide-react";

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto"><img src="/logo.jpeg" alt="Logo" className="w-full h-full rounded-full object-cover" /></div>
        <h1 className="font-serif text-4xl font-bold text-primary">About Yaaran E Ilm</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">یاران علم — Friends of Knowledge. A free peer-to-peer tutoring platform built for every student in Pakistan.</p>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 space-y-4">
        <h2 className="font-serif text-2xl font-bold text-primary">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">Quality education should not be a privilege. In Pakistan, millions of talented students lack access to good tutors due to cost, geography, or lack of connections. Yaaran E Ilm bridges this gap — connecting students with dedicated tutors who care about their success, completely free.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Heart className="w-6 h-6 text-accent" />, title: "Free Always", desc: "Our platform is free for students. Tutors can choose to offer free sessions or set their own rates." },
          { icon: <Users className="w-6 h-6 text-accent" />, title: "Peer-to-Peer", desc: "Learn from students who recently aced the same exams. Real experience, genuine support." },
          { icon: <BookOpen className="w-6 h-6 text-accent" />, title: "O/A Level Focus", desc: "Specialised support for O Levels, A Levels, Matric, and all Pakistani curricula." },
        ].map(item => (
          <div key={item.title} className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center">{item.icon}</div>
            <h3 className="font-serif text-lg font-bold text-primary">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-primary">Join Our Community</h2>
        <p className="text-muted-foreground">Whether you want to learn or teach, Yaaran E Ilm is for you.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Join as Student</Button></Link>
          <Link href="/tutors"><Button variant="outline">Meet Our Tutors</Button></Link>
        </div>
      </div>
    </div>
  );
}
