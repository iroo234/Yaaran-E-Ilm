import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, GraduationCap, LayoutDashboard, Users, ShieldCheck, MessageSquare, BookOpen, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";

export function Layout({ children }: { children: ReactNode }) {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/login") });
  };

  const isAdmin = (user as any)?.isAdmin === true;
  const isTutor = user?.role === "tutor";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.jpeg" alt="Yaaran E Ilm" className="h-9 w-9 rounded-full object-cover" />
              <span className="font-serif font-bold text-xl text-primary hidden sm:inline-block">Yaaran E Ilm</span>
            </Link>
            <nav className="hidden md:flex gap-5">
              <Link href="/tutors" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors gap-1"><Users className="w-4 h-4" />Tutors</Link>
              <Link href="/classes" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors gap-1"><GraduationCap className="w-4 h-4" />Classes</Link>
              <Link href="/resources" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors gap-1"><BookOpen className="w-4 h-4" />Resources</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <NotificationBell />
                <Link href="/messages"><Button variant="ghost" size="sm" className="font-medium gap-1.5 text-muted-foreground hover:text-primary"><MessageSquare className="w-4 h-4" />Messages</Button></Link>
                {isTutor && <Link href="/tutor-settings"><Button variant="ghost" size="sm" className="font-medium gap-1.5 text-muted-foreground hover:text-primary"><Settings className="w-4 h-4" />Settings</Button></Link>}
                {isAdmin && <Link href="/admin"><Button variant="ghost" size="sm" className="font-medium text-accent hover:text-accent/80 gap-1.5"><ShieldCheck className="w-4 h-4" />Admin</Button></Link>}
                <Link href="/dashboard"><Button variant="ghost" size="sm" className="font-medium gap-1.5"><LayoutDashboard className="w-4 h-4" />Dashboard</Button></Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-border text-muted-foreground hover:text-primary gap-1.5"><LogOut className="w-4 h-4" />Logout</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm" className="font-medium">Log in</Button></Link>
                <Link href="/register"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-sm">Join Free</Button></Link>
              </div>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-primary"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-4 bg-background">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                  <img src="/logo.jpeg" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
                  <span className="font-serif font-bold text-xl text-primary">Yaaran E Ilm</span>
                </div>
                <nav className="flex flex-col gap-3">
                  {[
                    { href: "/tutors", label: "Tutors", icon: <Users className="w-4 h-4" /> },
                    { href: "/classes", label: "Classes", icon: <GraduationCap className="w-4 h-4" /> },
                    { href: "/resources", label: "Resources", icon: <BookOpen className="w-4 h-4" /> },
                  ].map(i => <Link key={i.href} href={i.href} className="flex items-center gap-2 text-base font-medium text-primary">{i.icon}{i.label}</Link>)}
                  {user && <Link href="/dashboard" className="flex items-center gap-2 text-base font-medium text-primary"><LayoutDashboard className="w-4 h-4" />Dashboard</Link>}
                  {user && <Link href="/messages" className="flex items-center gap-2 text-base font-medium text-primary"><MessageSquare className="w-4 h-4" />Messages</Link>}
                  {isTutor && <Link href="/tutor-settings" className="flex items-center gap-2 text-base font-medium text-primary"><Settings className="w-4 h-4" />Settings</Link>}
                  {isAdmin && <Link href="/admin" className="flex items-center gap-2 text-base font-medium text-accent"><ShieldCheck className="w-4 h-4" />Admin</Link>}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user ? <Button variant="outline" onClick={handleLogout} className="w-full justify-start gap-2"><LogOut className="w-4 h-4" />Logout</Button>
                  : <><Link href="/login"><Button variant="outline" className="w-full">Log in</Button></Link><Link href="/register"><Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Join Free</Button></Link></>}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t border-border py-10 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-full object-cover" />
              <div><p className="font-serif text-lg font-bold text-primary">Yaaran E Ilm</p><p className="text-xs text-muted-foreground">Friends of Knowledge</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="space-y-2"><p className="font-semibold text-primary mb-2">Platform</p><Link href="/tutors" className="block hover:text-primary transition-colors">Find Tutors</Link><Link href="/classes" className="block hover:text-primary transition-colors">Classes</Link><Link href="/resources" className="block hover:text-primary transition-colors">Resources</Link></div>
              <div className="space-y-2"><p className="font-semibold text-primary mb-2">Company</p><Link href="/about" className="block hover:text-primary transition-colors">About Us</Link><Link href="/contact" className="block hover:text-primary transition-colors">Contact</Link></div>
              <div className="space-y-2"><p className="font-semibold text-primary mb-2">Legal</p><Link href="/privacy" className="block hover:text-primary transition-colors">Privacy Policy</Link><Link href="/terms" className="block hover:text-primary transition-colors">Terms of Use</Link></div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-sm text-muted-foreground">© 2026 Yaaran E Ilm. Free always. For every student in Pakistan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
