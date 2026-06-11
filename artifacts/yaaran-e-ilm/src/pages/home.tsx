import { useGetPlatformStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Users, Video, BookOpen } from "lucide-react";

export function Home() {
  const { data: stats, isLoading } = useGetPlatformStats();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight text-white">
            Friends of Knowledge
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto font-sans">
            A digital study hall for Pakistani students. Find trustworthy tutors, quality learning content, and a community driven by academic ambition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6">
                Start Learning
              </Button>
            </Link>
            <Link href="/tutors">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
                Find a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-card px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center p-6 bg-muted/50 rounded-2xl">
              <Users className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">
                {isLoading ? "-" : stats?.totalStudents || 0}
              </h3>
              <p className="text-muted-foreground font-medium text-lg">Students</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-muted/50 rounded-2xl">
              <GraduationCap className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">
                {isLoading ? "-" : stats?.totalTutors || 0}
              </h3>
              <p className="text-muted-foreground font-medium text-lg">Qualified Tutors</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-muted/50 rounded-2xl">
              <Video className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">
                {isLoading ? "-" : stats?.totalVideos || 0}
              </h3>
              <p className="text-muted-foreground font-medium text-lg">Video Lessons</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-muted/50 rounded-2xl">
              <BookOpen className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">
                {isLoading ? "-" : stats?.totalClasses || 0}
              </h3>
              <p className="text-muted-foreground font-medium text-lg">Active Classes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 bg-background border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary">Elevating Education</h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Yaaran E Ilm bridges the gap between ambitious students and experienced educators. 
            Whether you are preparing for O/A Levels, Matriculation, or FSC, our platform offers curated video lessons and live tutoring to help you excel.
          </p>
          <div className="pt-8">
            <Link href="/videos">
              <Button variant="ghost" className="text-secondary hover:text-secondary/80 text-lg">
                Explore Video Library →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}