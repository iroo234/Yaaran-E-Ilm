import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, GraduationCap, LayoutDashboard, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      }
    });
  };

  const navItems = [
    { label: "Tutors", href: "/tutors", icon: <Users className="w-4 h-4 mr-2" /> },
    { label: "Classes", href: "/classes", icon: <GraduationCap className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/logo.jpeg"
                alt="Yaaran E Ilm Logo"
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="font-serif font-bold text-xl text-primary hidden md:inline-block">
                Yaaran E Ilm
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium">
                  {user.name}
                </span>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="font-medium">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-accent text-primary hover:bg-accent/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-primary">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-sm">
                    Join Free
                  </Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-primary">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-4 bg-background">
                <div className="flex items-center space-x-2 pb-4 border-b border-border">
                  <img src="/logo.jpeg" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
                  <span className="font-serif font-bold text-xl text-primary">Yaaran E Ilm</span>
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-lg font-medium text-primary"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  {user && (
                    <Link href="/dashboard" className="flex items-center text-lg font-medium text-primary">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  )}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user ? (
                    <Button variant="outline" onClick={handleLogout} className="w-full justify-start border-accent text-primary">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full border-primary text-primary">Log in</Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Join Free</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-serif text-lg font-bold text-primary">Yaaran E Ilm</p>
                <p className="text-xs text-muted-foreground">Friends of Knowledge</p>
              </div>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/tutors" className="hover:text-primary transition-colors">Tutors</Link>
              <Link href="/classes" className="hover:text-primary transition-colors">Classes</Link>
              <Link href="/register" className="hover:text-primary transition-colors">Join Us</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Free. Always. For every student.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
