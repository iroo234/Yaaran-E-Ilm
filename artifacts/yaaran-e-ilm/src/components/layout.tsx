import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BookOpen, UserCircle, LogOut, Menu, Video, GraduationCap, Upload, LayoutDashboard } from "lucide-react";
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
    { label: "Tutors", href: "/tutors", icon: <UserCircle className="w-4 h-4 mr-2" /> },
    { label: "Videos", href: "/videos", icon: <Video className="w-4 h-4 mr-2" /> },
    { label: "Classes", href: "/classes", icon: <GraduationCap className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
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

          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="font-medium">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="ghost" size="sm" className="font-medium">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-4">
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-serif font-bold text-xl text-primary">
                    Yaaran E Ilm
                  </span>
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-lg font-medium"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link href="/dashboard" className="flex items-center text-lg font-medium">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                      <Link href="/upload" className="flex items-center text-lg font-medium">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Link>
                    </>
                  )}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user ? (
                    <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full">Log in</Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full">Get Started</Button>
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
      <footer className="border-t py-12 bg-card text-center text-muted-foreground mt-auto">
        <p className="font-serif text-lg mb-2">Yaaran E Ilm</p>
        <p className="text-sm">Empowering Pakistani students with knowledge and community.</p>
      </footer>
    </div>
  );
}