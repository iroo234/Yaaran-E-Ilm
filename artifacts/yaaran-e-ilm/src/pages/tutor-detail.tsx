import { useParams } from "wouter";
import { useGetTutor, useListClasses, useListVideos, getGetTutorQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Video as VideoIcon, BookOpen, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function TutorDetail() {
  const params = useParams();
  const tutorId = parseInt(params.id || "0", 10);
  
  const { data: tutor, isLoading } = useGetTutor(tutorId, {
    query: { enabled: !!tutorId, queryKey: getGetTutorQueryKey(tutorId) }
  });

  const { data: classes } = useListClasses({ tutorId });
  const { data: videos } = useListVideos({ uploaderId: tutor?.userId });

  if (isLoading) return <div className="p-12 text-center">Loading tutor profile...</div>;
  if (!tutor) return <div className="p-12 text-center text-destructive">Tutor not found</div>;

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="bg-card border border-border/50 rounded-2xl p-8 mb-12 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        <Avatar className="w-32 h-32 border-4 border-background shadow-md">
          <AvatarImage src={tutor.avatarUrl || undefined} />
          <AvatarFallback className="text-4xl bg-primary/5 text-primary">{tutor.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">{tutor.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center text-accent font-bold text-base">
                  <Star className="w-5 h-5 mr-1 fill-current" />
                  {tutor.rating ? tutor.rating.toFixed(1) : "New"}
                </span>
                <span className="flex items-center"><Users className="w-4 h-4 mr-1"/> {tutor.totalStudents} Students</span>
              </div>
            </div>
            <div className="flex gap-2">
              {tutor.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0 text-sm py-1 px-3">{tutor.subject}</Badge>}
              {tutor.level && <Badge variant="outline" className="text-sm py-1 px-3">{tutor.level}</Badge>}
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-muted-foreground mt-6">
            <h3 className="text-lg font-bold text-foreground mb-2">About Me</h3>
            <p>{tutor.bio || "No biography provided."}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-primary flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-secondary" /> Active Classes
            </h2>
          </div>
          {classes && classes.length > 0 ? (
            <div className="space-y-4">
              {classes.map(cls => (
                <Card key={cls.id} className="border-border/50 hover-elevate transition-all">
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{cls.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4 mr-1"/> {cls.schedule || "TBD"}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{cls.subject}</Badge>
                        <Badge variant="outline">{cls.level}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                      <div className="text-lg font-bold text-primary mb-2">
                        {cls.isFree ? "Free" : `Rs ${cls.price}`}
                      </div>
                      <Link href={`/classes/${cls.id}`}>
                        <Button size="sm">View Class</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground bg-muted/50 p-6 rounded-xl text-center border border-border/50">No classes currently offered.</p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-primary flex items-center">
              <VideoIcon className="w-6 h-6 mr-2 text-secondary" /> Video Lessons
            </h2>
          </div>
          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map(video => (
                <Link key={video.id} href={`/videos/${video.id}`}>
                  <Card className="overflow-hidden hover-elevate transition-all border-border/50 group h-full flex flex-col">
                    <div className="aspect-video bg-muted relative">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                          <VideoIcon className="w-8 h-8 text-secondary/40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold line-clamp-2 group-hover:text-primary transition-colors flex-1 mb-2">{video.title}</h4>
                      <p className="text-xs text-muted-foreground">{video.views} views</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground bg-muted/50 p-6 rounded-xl text-center border border-border/50">No videos uploaded yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}