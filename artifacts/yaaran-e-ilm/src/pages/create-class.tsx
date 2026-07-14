import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClass } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PlusCircle } from "lucide-react";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  schedule: z.string().optional(),
  maxStudents: z.coerce.number().min(1, "Must allow at least 1 student"),
  price: z.coerce.number().optional(),
  isFree: z.boolean().default(false),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

export function CreateClass() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createClass = useCreateClass();

  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      level: "",
      schedule: "",
      maxStudents: 20,
      price: 0,
      isFree: false,
    },
  });

  const isFree = form.watch("isFree");

  const onSubmit = (data: CreateClassFormValues) => {
    const payload = {
      ...data,
      price: data.isFree ? 0 : (data.price || 0),
    };

    createClass.mutate({ data: payload }, {
      onSuccess: (cls) => {
        toast({
          title: "Class Created",
          description: "Your class is now open for enrollment.",
        });
        setLocation(`/classes/${cls.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to create class",
          description: (error as any)?.error || "There was a problem creating your class.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-secondary" /> Host a New Class
        </h1>
        <p className="text-muted-foreground mt-2">Set up a live class session and start accepting enrollments.</p>
      </div>

      <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Class Title *</FormLabel>
                <FormControl><Input placeholder="e.g. O Level Physics Crash Course" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="schedule" render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule</FormLabel>
                <FormControl><Input placeholder="e.g. Every Monday & Wednesday at 6 PM PKT" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <FormField control={form.control} name="maxStudents" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Students *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isFree" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4 md:col-span-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Offer for Free</FormLabel>
                    <FormDescription>Students will not be charged to enroll.</FormDescription>
                  </div>
                </FormItem>
              )} />
            </div>

            {!isFree && (
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (PKR)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Class Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Provide details about what students will learn..." 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="pt-4 border-t border-border/50">
              <Button type="submit" size="lg" className="w-full md:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={createClass.isPending}>
                {createClass.isPending ? "Creating..." : "Create Class Listing"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}