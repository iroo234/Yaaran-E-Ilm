import { useParams } from "wouter";
import { useGetClass, useEnrollInClass, getGetClassQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, BookOpen, CheckCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function ClassDetail() {
  const params = useParams();
  const classId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cls, isLoading } = useGetClass(classId, {
    query: { enabled: !!classId, queryKey: getGetClassQueryKey(classId) }
  });

  const enrollMutation = useEnrollInClass();

  const handleEnroll = () => {
    enrollMutation.mutate({ id: classId }, {
      onSuccess: () => {
        toast({
          title: "Enrolled Successfully!",
          description: "You are now enrolled in this class.",
        });
        queryClient.invalidateQueries({ queryKey: getGetClassQueryKey(classId) });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Enrollment Failed",
          description: error.error || "Could not enroll in the class.",
        });
      }
    });
  };

  if (isLoading) return <div className="p-12 text-center">Loading class details...</div>;
  if (!cls) return <div className="p-12 text-center text-destructive">Class not found</div>;

  const isFull = cls.enrolledCount >= cls.maxStudents || cls.status === "full";
  const isClosed = cls.status === "closed";
  const canEnroll = cls.status === "open" && !isFull;

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {cls.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0 text-sm py-1 px-3">{cls.subject}</Badge>}
              {cls.level && <Badge variant="outline" className="text-sm py-1 px-3">{cls.level}</Badge>}
              <Badge variant={cls.status === "open" ? "default" : "secondary"} className={cls.status === "open" ? "bg-green-600 hover:bg-green-600" : ""}>
                {cls.status.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6">{cls.title}</h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>{cls.description || "No description provided for this class."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Schedule</h4>
                  <p className="text-muted-foreground">{cls.schedule || "To be determined"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-full text-secondary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Availability</h4>
                  <p className="text-muted-foreground">{cls.enrolledCount} of {cls.maxStudents} seats filled</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-sm text-muted-foreground mb-2">Enrollment Fee</div>
                <div className="text-4xl font-bold text-primary">
                  {cls.isFree ? "Free" : `Rs ${cls.price}`}
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full text-lg py-6 mb-4" 
                disabled={!canEnroll || enrollMutation.isPending}
                onClick={handleEnroll}
              >
                {enrollMutation.isPending ? "Enrolling..." : 
                 isClosed ? "Class Closed" : 
                 isFull ? "Class Full" : "Enroll Now"}
              </Button>
              
              <div className="flex items-center justify-center text-sm text-muted-foreground gap-2">
                <Info className="w-4 h-4" />
                <span>{canEnroll ? "Seats are limited" : "Currently unavailable"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-lg mb-4 text-left">Your Tutor</h3>
              <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-border">
                <AvatarImage src={cls.tutorAvatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {cls.tutorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-bold text-primary text-xl mb-2">{cls.tutorName}</h4>
              <Link href={`/tutors/${cls.tutorId}`}>
                <Button variant="outline" className="w-full mt-2">View Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}