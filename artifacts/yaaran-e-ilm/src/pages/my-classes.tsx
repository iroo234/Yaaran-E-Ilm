import { useGetMyClasses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function MyClasses() {
  const { data: classes, isLoading } = useGetMyClasses();

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">My Classes</h1>
          <p className="text-lg text-muted-foreground">Manage your enrolled and hosted sessions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-muted h-40 rounded-xl" />)}
        </div>
      ) : classes?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No classes yet</h3>
          <p className="text-muted-foreground mb-6">You haven't joined or created any classes.</p>
          <Link href="/classes"><Button>Browse Classes</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes?.map(cls => (
            <Card key={cls.id} className="border-border/50 hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{cls.subject}</Badge>
                      <Badge variant={cls.status === "open" ? "default" : "secondary"}>{cls.status}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-1">{cls.title}</h3>
                    <p className="text-sm text-muted-foreground">Tutor: {cls.tutorName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6 bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span className="truncate">{cls.schedule || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span>{cls.enrolledCount} Students</span>
                  </div>
                </div>
                
                <div className="flex justify-end border-t border-border/40 pt-4">
                  <Link href={`/classes/${cls.id}`}>
                    <Button variant="outline" size="sm">Go to Class Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}