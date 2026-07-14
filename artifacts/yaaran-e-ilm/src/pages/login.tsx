import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const qc = useQueryClient();
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const phoneMutation = useMutation({
    mutationFn: async (p: string) => {
      const res = await fetch(`${BASE}/api/profile/phone`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: p }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "Phone number saved! ✅", description: "Your account is now fully activated." });
      setLocation("/dashboard");
    },
    onError: (e: Error) => setPhoneError(e.message),
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res: any) => {
        if (res?.needsPhone) {
          setNeedsPhone(true);
          return;
        }
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        setLocation("/dashboard");
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Login failed", description: error.error || "Please check your credentials." }),
    });
  };

  const handlePhoneSubmit = () => {
    setPhoneError("");
    if (!/^03\d{9}$/.test(phone)) { setPhoneError("Enter a valid Pakistani number (03XXXXXXXXX, 11 digits)"); return; }
    phoneMutation.mutate(phone);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border/50">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src="/logo.jpeg" alt="Logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-accent/30" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue your learning journey</p>
        </div>

        <AnimatePresence mode="wait">
          {needsPhone ? (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center space-y-2">
                <Phone className="w-8 h-8 text-accent mx-auto" />
                <h2 className="font-serif text-lg font-bold text-primary">Welcome back!</h2>
                <p className="text-sm text-muted-foreground">We've updated our system. Please add your phone number to reactivate your account.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Phone Number (Pakistani format: 03XXXXXXXXX)</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03001234567" className="border-border focus:border-accent transition-all" />
                {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
              </div>
              <Button onClick={handlePhoneSubmit} disabled={phoneMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all font-semibold py-5">
                {phoneMutation.isPending ? "Saving..." : "Activate Account"}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="name@example.com" type="email" className="border-border focus:border-accent transition-all focus:ring-2 focus:ring-accent/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel>
                      <FormControl><Input placeholder="••••••••" type="password" className="border-border focus:border-accent transition-all focus:ring-2 focus:ring-accent/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.01] transition-all" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary font-semibold hover:underline">Register here</Link>
        </div>
      </div>
    </motion.div>
  );
}
