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

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.student),
});

const tutorSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  subject: z.string().min(1, "Please select a primary subject"),
  level: z.string().min(1, "Please select a level"),
  bio: z.string().optional(),
});

const teamSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  bio: z.string().min(10, "Please tell us a bit about yourself and how you want to contribute"),
});

type StudentFormValues = z.infer<typeof studentSchema>;
type TutorFormValues = z.infer<typeof tutorSchema>;
type TeamFormValues = z.infer<typeof teamSchema>;

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

  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const tutorForm = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: { name: "", email: "", password: "", role: "tutor", subject: "", level: "", bio: "" },
  });

  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", email: "", password: "", role: "tutor", bio: "" },
  });

  const onSubmitStudent = (data: StudentFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Welcome to Yaaran E Ilm!", description: "Your student account is ready." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: error?.error || "An error occurred." });
      }
    });
  };

  const onSubmitTutor = (data: TutorFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Welcome aboard!", description: "Your tutor profile is ready." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: error?.error || "An error occurred." });
      }
    });
  };

  const onSubmitTeam = (data: TeamFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Welcome to the team!", description: "Thank you for joining us. We will be in touch." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: error?.error || "An error occurred." });
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-start justify-center p-4 py-12 bg-gradient-to-b from-accent/10 to-background">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <img
            src="/logo.jpeg"
            alt="Yaaran E Ilm"
            className="h-16 w-16 rounded-full object-cover mx-auto shadow-md ring-2 ring-accent/30"
          />
          <h1 className="text-3xl font-serif font-bold text-primary">Join Yaaran E Ilm</h1>
          <p className="text-muted-foreground text-sm">Free. Always. For every student and tutor.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-muted/50 h-auto p-0">
              <TabsTrigger
                value="student"
                className="flex flex-col items-center gap-1 py-4 rounded-none border-r border-border data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none text-xs font-semibold"
              >
                <BookOpen className="w-4 h-4" />
                Student
              </TabsTrigger>
              <TabsTrigger
                value="tutor"
                className="flex flex-col items-center gap-1 py-4 rounded-none border-r border-border data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none text-xs font-semibold"
              >
                <GraduationCap className="w-4 h-4" />
                Tutor
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex flex-col items-center gap-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none text-xs font-semibold"
              >
                <Users className="w-4 h-4" />
                Team Member
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <TabsContent value="student" className="mt-0">
                <div className="mb-6">
                  <h2 className="font-serif text-lg font-bold text-primary">I want to learn</h2>
                  <p className="text-sm text-muted-foreground mt-1">Get access to free tutors and live classes across all subjects and levels.</p>
                </div>
                <Form {...studentForm}>
                  <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-4">
                    <FormField control={studentForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Full Name</FormLabel>
                        <FormControl><Input placeholder="Ali Khan" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={studentForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Email</FormLabel>
                        <FormControl><Input placeholder="ali@example.com" type="email" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={studentForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-5 mt-2" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : "Create Student Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="tutor" className="mt-0">
                <div className="mb-6">
                  <h2 className="font-serif text-lg font-bold text-primary">I want to teach</h2>
                  <p className="text-sm text-muted-foreground mt-1">Share your knowledge, create classes, and help students across Pakistan — for free.</p>
                </div>
                <Form {...tutorForm}>
                  <form onSubmit={tutorForm.handleSubmit(onSubmitTutor)} className="space-y-4">
                    <FormField control={tutorForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Full Name</FormLabel>
                        <FormControl><Input placeholder="Dr. Ahmed" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={tutorForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Email</FormLabel>
                        <FormControl><Input placeholder="ahmed@example.com" type="email" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={tutorForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={tutorForm.control} name="subject" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-medium">Primary Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={tutorForm.control} name="level" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-medium">Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="border-border"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={tutorForm.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Short Bio</FormLabel>
                        <FormControl><Textarea placeholder="Tell students about your experience and teaching style..." className="border-border focus:border-accent resize-none" rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-5 mt-2" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : "Apply as Tutor"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <div className="mb-6">
                  <h2 className="font-serif text-lg font-bold text-primary">I want to help build this</h2>
                  <p className="text-sm text-muted-foreground mt-1">Join the Yaaran E Ilm team as a volunteer — help with outreach, operations, and growing this community.</p>
                </div>
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(onSubmitTeam)} className="space-y-4">
                    <FormField control={teamForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Full Name</FormLabel>
                        <FormControl><Input placeholder="Your Name" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={teamForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" type="email" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={teamForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl><Input placeholder="••••••••" type="password" className="border-border focus:border-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={teamForm.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Tell us about yourself</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How would you like to contribute? What skills or experience can you bring to Yaaran E Ilm?"
                            className="border-border focus:border-accent resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-5 mt-2" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Submitting..." : "Join the Team"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
