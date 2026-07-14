import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [setupEnabled, setSetupEnabled] = useState<boolean | null>(null);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    fetch(`${BASE}/api/setup/status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSetupEnabled(d.setupEnabled); setAdminCount(d.adminCount); })
      .catch(() => setSetupEnabled(true));
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
      toast({ title: "Admin account created! 🎉", description: "Redirecting to admin panel..." });
      setTimeout(() => setLocation("/admin"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Setup failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (setupEnabled === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h2 className="font-serif text-2xl font-bold text-primary">Admin account created!</h2>
        <p className="text-muted-foreground">Redirecting to the admin panel...</p>
      </motion.div>
    );
  }

  if (!setupEnabled) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-primary text-center">Setup Locked</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          The maximum number of admin accounts ({adminCount}) has been reached. An existing admin can re-enable setup from the admin panel.
        </p>
        <Button onClick={() => setLocation("/login")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Go to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-primary">Create Admin Account</h1>
            <p className="text-sm text-muted-foreground">
              {adminCount === 0 ? "Set up the first admin account for Yaaran E Ilm." : `Add another admin account (${adminCount}/2 used).`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border-border focus:border-accent transition-all" required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="border-border focus:border-accent transition-all" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="border-border focus:border-accent transition-all" required minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all font-semibold py-5" disabled={loading}>
              {loading ? "Creating account..." : "Create Admin Account"}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
