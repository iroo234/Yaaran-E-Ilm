import { useState } from "react";
import { Link, useLocation } from "wouter";
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
import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.student)
});

const tutorSchema = baseSchema.extend({
  role: z.literal(RegisterInputRole.tutor),
  subject: z.string().min(1, "Please select a primary subject"),
  level: z.string().min(1, "Please select a level"),
  bio: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;
type TutorFormValues = z.infer<typeof tutorSchema>;

export function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [role, setRole] = useState<"student" | "tutor">("student");

  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const tutorForm = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: { name: "", email: "", password: "", role: "tutor", subject: "", level: "", bio: "" },
  });

  const onSubmitStudent = (data: StudentFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Registration successful!", description: "Welcome to Yaaran E Ilm." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Registration failed", description: error.error || "An error occurred." });
      }
    });
  };

  const onSubmitTutor = (data: TutorFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Registration successful!", description: "Welcome as a tutor." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Registration failed", description: error.error || "An error occurred." });
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border/50">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary">Join Yaaran E Ilm</h1>
          <p className="text-muted-foreground">Start your educational journey with us</p>
        </div>

        <Tabs defaultValue="student" onValueChange={(v) => setRole(v as "student" | "tutor")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="student" className="text-base py-3">I am a Student</TabsTrigger>
            <TabsTrigger value="tutor" className="text-base py-3">I am a Tutor</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-4">
                <FormField control={studentForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Ali Khan" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={studentForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ali@example.com" type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={studentForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full text-lg py-6 mt-4" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Create Student Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="tutor">
            <Form {...tutorForm}>
              <form onSubmit={tutorForm.handleSubmit(onSubmitTutor)} className="space-y-4">
                <FormField control={tutorForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Dr. Ahmed" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={tutorForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ahmed@example.com" type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={tutorForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input placeholder="••••••••" type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={tutorForm.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={tutorForm.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
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
                    <FormLabel>Short Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell students about your experience..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full text-lg py-6 mt-4" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Apply as Tutor"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}