import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVideo } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Upload as UploadIcon } from "lucide-react";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL (e.g. YouTube link)"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  subject: z.string().optional(),
  level: z.string().optional(),
  duration: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function Upload() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createVideo = useCreateVideo();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      subject: "",
      level: "",
      duration: "",
    },
  });

  const onSubmit = (data: UploadFormValues) => {
    // Clean up empty strings
    const payload = {
      ...data,
      thumbnailUrl: data.thumbnailUrl || undefined,
    };

    createVideo.mutate({ data: payload }, {
      onSuccess: (video) => {
        toast({
          title: "Video Uploaded",
          description: "Your video has been successfully added to the library.",
        });
        setLocation(`/videos/${video.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: (error as any)?.error || "There was a problem uploading your video.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
          <UploadIcon className="w-8 h-8 text-secondary" /> Upload Educational Video
        </h1>
        <p className="text-muted-foreground mt-2">Share your knowledge with students across Pakistan.</p>
      </div>

      <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Video Title *</FormLabel>
                <FormControl><Input placeholder="e.g. Introduction to Calculus" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="videoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Video/YouTube URL *</FormLabel>
                  <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail Image URL (Optional)</FormLabel>
                  <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. 15:30" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Briefly describe what this video covers..." 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="pt-4 border-t border-border/50">
              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={createVideo.isPending}>
                {createVideo.isPending ? "Uploading..." : "Publish Video"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}