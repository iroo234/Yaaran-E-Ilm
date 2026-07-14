import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, RegisterInputRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { motion } from "framer-motion";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Urdu","History","Geography","Computer Science","Economics","Accounting","Islamic Studies","Pakistan Studies"];
const LEVELS = ["O Level","O1","O2","O3","A Level","Grade 6","Grade 7","Grade 8"];

const phoneRegex = /^03\d{9}$/;

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.student),
  phone: z.string().regex(phoneRegex, "Enter a valid Pakistani number (03XXXXXXXXX, 11 digits)"),
  grade: z.string().min(1, "Please select your class/grade"),
  age: z.coerce.number().min(5, "Age must be at least 5").max(25, "Age must be 25 or below"),
});

const tutorSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  subject: z.string().min(1, "Please select a primary subject"),
  level: z.string().min(1, "Please select a level"),
  bio: z.string().optional(),
  phone: z.string().regex(phoneRegex, "Enter a valid Pakistani number (03XXXXXXXXX, 11 digits)"),
});

const teamSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  bio: z.string().min(10, "Please tell us a bit about yourself and how you want to contribute"),
  phone: z.string().regex(phoneRegex, "Enter a valid Pakistani number (03XXXXXXXXX, 11 digits)"),
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const defaultTab = (() => {
    const params = new URLSearchParams(search);
    const role = params.get("role");
    if (role === "tutor") return "tutor";
    if (role === "team") return "team";
    return "student";
  })();

  const [activeTab, setActiveTab] = useState(defaultTab);

  const studentForm = useForm({ resolver: zodResolver(studentSchema), defaultValues: { name: "", email: "", password: "", role: "student" as const, phone: "", grade: "", age: undefined as unknown as number } });
  const tutorForm = useForm({ resolver: zodResolver(tutorSchema), defaultValues: { name: "", email: "", password: "", role: "tutor" as const, subject: "", level: "", bio: "", phone: "" } });
  const teamForm = useForm({ resolver: zodResolver(teamSchema), defaultValues: { name: "", email: "", password: "", role: "tutor" as const, bio: "", phone: "" } });

  const submitStudent = (data: any) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => { toast({ title: "Welcome to Yaaran E Ilm! 🎉", description: "Your student account is ready." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || "An error occurred." }),
    });
  };

  const submitTutor = (data: any) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => { toast({ title: "Application submitted!", description: "Your tutor profile is pending admin approval. You'll be notified soon." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || "An error occurred." }),
    });
  };

  const submitTeam = (data: any) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => { toast({ title: "Welcome to the team! 🙌", description: "Thank you for joining. We will be in touch shortly." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || "An error occurred." }),
    });
  };

  const inputClass = "border-border focus:border-accent transition-all duration-200 focus:ring-2 focus:ring-accent/20";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-8rem)] flex items-start justify-center p-4 py-12 bg-gradient-to-b from-accent/10 to-background">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <img src="/logo.jpeg" alt="Yaaran E Ilm" className="h-16 w-16 rounded-full object-cover mx-auto shadow-md ring-2 ring-accent/30" />
          <h1 className="text-3xl font-serif font-bold text-primary">Join Yaaran E Ilm</h1>
          <p className="text-muted-foreground text-sm">Free. Always. For every student and tutor.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-muted/50 h-auto p-0">
              {[{ value: "student", icon: <BookOpen className="w-4 h-4" />, label: "Student" }, { value: "tutor", icon: <GraduationCap className="w-4 h-4" />, label: "Tutor" }, { value: "team", icon: <Users className="w-4 h-4" />, label: "Team" }].map((t, i) => (
                <TabsTrigger key={t.value} value={t.value} className={`flex flex-col items-center gap-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none text-xs font-semibold ${i < 2 ? "border-r border-border" : ""}`}>
                  {t.icon}{t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-8">
              {/* Student */}
              <TabsContent value="student" className="mt-0">
                <div className="mb-5"><h2 className="font-serif text-lg font-bold text-primary">I want to learn</h2><p className="text-sm text-muted-foreground mt-1">Get access to free tutors and live classes across all subjects.</p></div>
                <Form {...studentForm}>
                  <form onSubmit={studentForm.handleSubmit(submitStudent)} className="space-y-4">
                    <FormField control={studentForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Ali Khan" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={studentForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ali@example.com" type="email" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={studentForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={studentForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number <span className="text-xs text-muted-foreground">(Pakistani format: 03XXXXXXXXX)</span></FormLabel><FormControl><Input placeholder="03001234567" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={studentForm.control} name="grade" render={({ field }) => (
                        <FormItem><FormLabel>Class / Grade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select grade" /></SelectTrigger></FormControl>
                            <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={studentForm.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="15" min={5} max={25} className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all font-semibold py-5 mt-2" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Creating account..." : "Create Student Account"}</Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Tutor */}
              <TabsContent value="tutor" className="mt-0">
                <div className="mb-5"><h2 className="font-serif text-lg font-bold text-primary">I want to teach</h2><p className="text-sm text-muted-foreground mt-1">Share your knowledge. Your profile will be reviewed by admin before going live.</p></div>
                <Form {...tutorForm}>
                  <form onSubmit={tutorForm.handleSubmit(submitTutor)} className="space-y-4">
                    <FormField control={tutorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Dr. Ahmed" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ahmed@example.com" type="email" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number <span className="text-xs text-muted-foreground">(03XXXXXXXXX)</span></FormLabel><FormControl><Input placeholder="03001234567" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={tutorForm.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={tutorForm.control} name="level" render={({ field }) => (
                        <FormItem><FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                            <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={tutorForm.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Short Bio</FormLabel><FormControl><Textarea placeholder="Tell students about your experience and teaching style..." className="border-border resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all font-semibold py-5 mt-2" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Submitting..." : "Apply as Tutor"}</Button>
                    <p className="text-xs text-center text-muted-foreground">Your profile will be reviewed by the admin team before appearing publicly.</p>
                  </form>
                </Form>
              </TabsContent>

              {/* Team */}
              <TabsContent value="team" className="mt-0">
                <div className="mb-5"><h2 className="font-serif text-lg font-bold text-primary">I want to help build this</h2><p className="text-sm text-muted-foreground mt-1">Join as a volunteer — help with outreach, operations, and growing this community.</p></div>
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(submitTeam)} className="space-y-4">
                    <FormField control={teamForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" type="email" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number <span className="text-xs text-muted-foreground">(03XXXXXXXXX)</span></FormLabel><FormControl><Input placeholder="03001234567" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Tell us about yourself</FormLabel><FormControl><Textarea placeholder="How would you like to contribute? What skills can you bring?" className="border-border resize-none" rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all font-semibold py-5 mt-2" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Submitting..." : "Join the Team"}</Button>
                  </form>
                </Form>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link></p>
      </div>
    </motion.div>
  );
}
