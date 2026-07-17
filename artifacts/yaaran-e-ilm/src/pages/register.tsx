import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Urdu","History","Geography","Computer Science","Economics","Accounting","Islamic Studies","Pakistan Studies"];
const LEVELS = ["O Level","O1","O2","O3","A Level","Grade 6","Grade 7","Grade 8"];
const EXPERIENCE_OPTIONS = ["Less than 1 year", "1–2 years", "3–5 years", "5–10 years", "10+ years"];
const QUALIFICATIONS = ["Matriculation", "Intermediate (FSc/FA)", "Bachelor's Degree", "Master's Degree", "PhD", "Other"];
const TEAM_ROLES = ["Content Creation", "Student Outreach", "Social Media & Marketing", "Operations & Admin", "IT / Technology", "Teaching Support", "Community Management", "Other"];
const AVAILABILITY_OPTIONS = ["2–5 hrs/week", "5–10 hrs/week", "10–15 hrs/week", "15+ hrs/week"];

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
  yearsExperience: z.string().min(1, "Please select your years of experience"),
  qualification: z.string().min(1, "Please select your highest qualification"),
  institution: z.string().optional(),
});

const teamSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  phone: z.string().regex(phoneRegex, "Enter a valid Pakistani number (03XXXXXXXXX, 11 digits)"),
  roleApplying: z.string().min(1, "Please select the role you're applying for"),
  bio: z.string().min(20, "Please tell us a bit about yourself (at least 20 characters)"),
  skills: z.string().min(5, "Please describe your skills"),
  availability: z.string().min(1, "Please select your availability"),
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Letter animation ────────────────────────────────────────────────────────

type LetterPhase = "flying-in" | "landed" | "opening" | "flying-away";

function EnvelopeSVG({ flap }: { flap: boolean }) {
  return (
    <svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      {/* Envelope body */}
      <rect x="2" y="40" width="216" height="118" rx="6" fill="#fef9f0" stroke="#d4b896" strokeWidth="2" />
      {/* Bottom-left triangle */}
      <polygon points="2,160 110,90 2,40" fill="#fdebd0" stroke="#d4b896" strokeWidth="1.5" />
      {/* Bottom-right triangle */}
      <polygon points="218,160 110,90 218,40" fill="#fdebd0" stroke="#d4b896" strokeWidth="1.5" />
      {/* Bottom V crease */}
      <polygon points="2,160 110,100 218,160" fill="#fef3e2" stroke="#d4b896" strokeWidth="1.5" />
      {/* Top flap — rotates when opening */}
      <motion.polygon
        points="2,40 110,100 218,40"
        fill={flap ? "#f5e6cc" : "#fdebd0"}
        stroke="#d4b896"
        strokeWidth="1.5"
        animate={flap ? { rotateX: 160 } : { rotateX: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "110px 40px", transformBox: "fill-box" }}
      />
      {/* Seal */}
      <circle cx="110" cy="100" r="18" fill="hsl(338 45% 72%)" stroke="hsl(338 45% 62%)" strokeWidth="2" />
      <text x="110" y="105" textAnchor="middle" fill="hsl(18 32% 20%)" fontSize="9" fontFamily="Georgia, serif" fontWeight="bold">YEI</text>
      {/* Letter lines peeking */}
      <line x1="50" y1="135" x2="170" y2="135" stroke="#c9b49a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="65" y1="148" x2="155" y2="148" stroke="#c9b49a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LetterIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<LetterPhase>("flying-in");

  useEffect(() => {
    const t = setTimeout(() => setPhase("landed"), 900);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    if (phase !== "landed") return;
    setPhase("opening");
    setTimeout(() => {
      setPhase("flying-away");
    }, 600);
    setTimeout(() => {
      onComplete();
    }, 1100);
  };

  const variants = {
    "flying-in": { y: 380, x: 60, rotate: 22, scale: 0.7, opacity: 0 },
    "landed": { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 },
    "opening": { y: -18, x: 0, rotate: 0, scale: 1.06, opacity: 1 },
    "flying-away": { y: -500, x: -80, rotate: -30, scale: 0.5, opacity: 0 },
  };

  const transitions: Record<LetterPhase, object> = {
    "flying-in": { type: "spring", stiffness: 55, damping: 13 },
    "landed": { type: "spring", stiffness: 200, damping: 18 },
    "opening": { duration: 0.3, ease: "easeOut" },
    "flying-away": { duration: 0.5, ease: "easeIn" },
  };

  return (
    <div className="py-6 flex flex-col items-center gap-5">
      <motion.div
        animate={phase}
        variants={variants}
        transition={transitions[phase]}
        onClick={handleClick}
        whileHover={phase === "landed" ? { scale: 1.04, rotate: 1 } : {}}
        whileTap={phase === "landed" ? { scale: 0.97 } : {}}
        className={`w-52 h-36 ${phase === "landed" ? "cursor-pointer" : "pointer-events-none"}`}
        style={{ filter: phase === "landed" ? "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" : undefined }}
      >
        <EnvelopeSVG flap={phase === "opening" || phase === "flying-away"} />
      </motion.div>

      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-1.5"
          >
            <p className="text-primary font-semibold text-sm">You have a letter! ✉️</p>
            <p className="text-muted-foreground text-xs">Tap the envelope to open your invitation</p>
          </motion.div>
        )}
        {phase === "opening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-accent font-semibold text-sm">Opening...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Register page ────────────────────────────────────────────────────────────

export function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [studentAnimDone, setStudentAnimDone] = useState(false);

  const defaultTab = (() => {
    const params = new URLSearchParams(search);
    const role = params.get("role");
    if (role === "tutor") return "tutor";
    if (role === "team") return "team";
    return "student";
  })();

  const [activeTab, setActiveTab] = useState(defaultTab);

  const studentForm = useForm({ resolver: zodResolver(studentSchema), defaultValues: { name: "", email: "", password: "", role: "student" as const, phone: "", grade: "", age: undefined as unknown as number } });
  const tutorForm = useForm({
    resolver: zodResolver(tutorSchema),
    defaultValues: { name: "", email: "", password: "", role: "tutor" as const, subject: "", level: "", bio: "", phone: "", yearsExperience: "", qualification: "", institution: "" },
  });
  const teamForm = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", email: "", password: "", role: "tutor" as const, phone: "", roleApplying: "", bio: "", skills: "", availability: "" },
  });

  const submitStudent = (data: any) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => { toast({ title: "Welcome to Yaaran E Ilm! 🎉", description: "Your student account is ready." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || e?.message || "An error occurred." }),
    });
  };

  const submitTutor = (data: any) => {
    const { yearsExperience, qualification, institution, bio, ...rest } = data;
    const fullBio = [
      bio,
      `Teaching experience: ${yearsExperience}`,
      `Highest qualification: ${qualification}`,
      institution ? `Current institution: ${institution}` : null,
    ].filter(Boolean).join("\n");
    registerMutation.mutate({ data: { ...rest, bio: fullBio } }, {
      onSuccess: () => { toast({ title: "Application submitted! 🎓", description: "Your tutor profile is pending admin review. You'll be notified soon." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || e?.message || "An error occurred." }),
    });
  };

  const submitTeam = (data: any) => {
    const { roleApplying, bio, skills, availability, ...rest } = data;
    const fullBio = [
      `Role applying for: ${roleApplying}`,
      `About me: ${bio}`,
      `Skills: ${skills}`,
      `Availability: ${availability}`,
    ].join("\n");
    registerMutation.mutate({ data: { ...rest, bio: fullBio } }, {
      onSuccess: () => { toast({ title: "Application received! 🙌", description: "Thank you for wanting to join. We'll be in touch shortly." }); setLocation("/dashboard"); },
      onError: (e: any) => toast({ variant: "destructive", title: "Registration failed", description: e?.error || e?.message || "An error occurred." }),
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
              {/* ── Student ── */}
              <TabsContent value="student" className="mt-0">
                <AnimatePresence mode="wait">
                  {!studentAnimDone ? (
                    <motion.div key="letter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }} transition={{ duration: 0.3 }}>
                      <div className="mb-4 text-center">
                        <h2 className="font-serif text-lg font-bold text-primary">Your invitation awaits</h2>
                        <p className="text-sm text-muted-foreground mt-1">Open your letter to begin your learning journey</p>
                      </div>
                      <LetterIntro onComplete={() => setStudentAnimDone(true)} />
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                      <div className="mb-5">
                        <h2 className="font-serif text-lg font-bold text-primary">I want to learn</h2>
                        <p className="text-sm text-muted-foreground mt-1">Get access to free tutors and live classes across all subjects.</p>
                      </div>
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* ── Tutor ── */}
              <TabsContent value="tutor" className="mt-0">
                <div className="mb-5">
                  <h2 className="font-serif text-lg font-bold text-primary">Apply as a Tutor</h2>
                  <p className="text-sm text-muted-foreground mt-1">Share your knowledge. Tell us about your experience — your profile will be reviewed before going live.</p>
                </div>
                <Form {...tutorForm}>
                  <form onSubmit={tutorForm.handleSubmit(submitTutor)} className="space-y-4">
                    <FormField control={tutorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Dr. Ahmed" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ahmed@example.com" type="email" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={tutorForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number <span className="text-xs text-muted-foreground">(03XXXXXXXXX)</span></FormLabel><FormControl><Input placeholder="03001234567" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={tutorForm.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Primary Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={tutorForm.control} name="level" render={({ field }) => (
                        <FormItem><FormLabel>Level You Teach</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                            <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={tutorForm.control} name="yearsExperience" render={({ field }) => (
                        <FormItem><FormLabel>Teaching Experience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select years" /></SelectTrigger></FormControl>
                            <SelectContent>{EXPERIENCE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={tutorForm.control} name="qualification" render={({ field }) => (
                        <FormItem><FormLabel>Highest Qualification</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>{QUALIFICATIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={tutorForm.control} name="institution" render={({ field }) => (<FormItem><FormLabel>Current School / Institution <span className="text-xs text-muted-foreground">(optional)</span></FormLabel><FormControl><Input placeholder="e.g. LUMS, Beaconhouse, Private tutor" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <FormField control={tutorForm.control} name="bio" render={({ field }) => (<FormItem><FormLabel>About You & Your Teaching Style</FormLabel><FormControl><Textarea placeholder="Tell students about your background, what makes your teaching effective, and why you want to teach at YEI..." className="border-border resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all font-semibold py-5 mt-2" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Submitting..." : "Apply as Tutor"}</Button>
                    <p className="text-xs text-center text-muted-foreground">Your application will be reviewed by the admin team before your profile appears publicly.</p>
                  </form>
                </Form>
              </TabsContent>

              {/* ── Team ── */}
              <TabsContent value="team" className="mt-0">
                <div className="mb-5">
                  <h2 className="font-serif text-lg font-bold text-primary">Join Our Team</h2>
                  <p className="text-sm text-muted-foreground mt-1">Volunteer with us — help grow, support, and improve Yaaran E Ilm for students across Pakistan.</p>
                </div>
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(submitTeam)} className="space-y-4">
                    <FormField control={teamForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" type="email" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={teamForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number <span className="text-xs text-muted-foreground">(03XXXXXXXXX)</span></FormLabel><FormControl><Input placeholder="03001234567" className={inputClass} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={teamForm.control} name="roleApplying" render={({ field }) => (
                        <FormItem><FormLabel>Role You're Applying For</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                            <SelectContent>{TEAM_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={teamForm.control} name="availability" render={({ field }) => (
                        <FormItem><FormLabel>Weekly Availability</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                            <SelectContent>{AVAILABILITY_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={teamForm.control} name="skills" render={({ field }) => (<FormItem><FormLabel>Your Skills & Experience</FormLabel><FormControl><Textarea placeholder="e.g. Graphic design, social media, teaching, event management, coding..." className="border-border resize-none" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <FormField control={teamForm.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Why do you want to join YEI?</FormLabel><FormControl><Textarea placeholder="Tell us what motivates you, what you'd like to contribute, and what YEI means to you..." className="border-border resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all font-semibold py-5 mt-2" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Submitting..." : "Submit Application"}</Button>
                    <p className="text-xs text-center text-muted-foreground">We review all applications and will reach out within a few days.</p>
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
