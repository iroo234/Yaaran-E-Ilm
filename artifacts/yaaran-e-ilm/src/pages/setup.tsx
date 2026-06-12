import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, CheckCircle, Lock } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    fetch(`${BASE}/api/setup/status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setAdminExists(d.adminExists))
      .catch(() => setAdminExists(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/setup/admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Setup failed");
      setDone(true);
      toast({ title: "Admin account created!", description: "Redirecting to admin panel..." });
      setTimeout(() => setLocation("/admin"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Setup failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (adminExists === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Checking setup status...</div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-bold text-primary text-center">Setup Already Complete</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          An admin account already exists. This setup page is disabled for security.
        </p>
        <Button onClick={() => setLocation("/login")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Go to Login
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h2 className="font-serif text-2xl font-bold text-primary">Admin account created!</h2>
        <p className="text-muted-foreground">Redirecting to the admin panel...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary">Platform Setup</h1>
            <p className="text-sm text-muted-foreground">
              Create the admin account for <strong>Yaaran E Ilm</strong>. This page is only available once.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Admin Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
