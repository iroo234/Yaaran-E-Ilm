import { useGetMe, useGetPlatformStats, useGetMyClasses, useGetMyVideos } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, Users, GraduationCap, PlusCircle, Upload } from "lucide-react";

export function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: myClasses } = useGetMyClasses({ query: { enabled: !!user } });
  const { data: myVideos } = useGetMyVideos({ query: { enabled: !!user } });

  if (userLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in</h2>
        <Link href="/login"><Button>Go to Login</Button></Link>
      </div>
    );
  }

  const isTutor = user.role === "tutor";

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Welcome back, {user.name}</h1>
          <p className="text-lg text-muted-foreground">
            {isTutor ? "Manage your classes and content." : "Continue your learning journey."}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/upload">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" /> Upload Video
            </Button>
          </Link>
          {isTutor && (
            <Link href="/create-class">
              <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <PlusCircle className="w-4 h-4" /> Create Class
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Role</CardTitle>
            <UserIcon className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-primary">{user.role}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Classes</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{myClasses?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Videos</CardTitle>
            <PlayCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{myVideos?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-primary">Recent Classes</h2>
            <Link href="/my/classes"><Button variant="link">View All</Button></Link>
          </div>
          {myClasses && myClasses.length > 0 ? (
            <div className="space-y-4">
              {myClasses.slice(0, 3).map(cls => (
                <Card key={cls.id} className="p-4 border-border/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-lg">{cls.title}</h4>
                    <p className="text-sm text-muted-foreground">{cls.subject} • {cls.level}</p>
                  </div>
                  <Link href={`/classes/${cls.id}`}>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground mb-4">You have no active classes.</p>
              {isTutor ? (
                <Link href="/create-class"><Button>Create your first class</Button></Link>
              ) : (
                <Link href="/classes"><Button>Browse classes</Button></Link>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif text-primary">Recent Videos</h2>
            <Link href="/my/videos"><Button variant="link">View All</Button></Link>
          </div>
          {myVideos && myVideos.length > 0 ? (
            <div className="space-y-4">
              {myVideos.slice(0, 3).map(video => (
                <Card key={video.id} className="p-4 border-border/50 flex items-center gap-4">
                  <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10"><PlayCircle className="w-6 h-6 text-secondary/50" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{video.title}</h4>
                    <p className="text-sm text-muted-foreground">{video.views} views</p>
                  </div>
                  <Link href={`/videos/${video.id}`}>
                    <Button variant="ghost" size="icon"><PlayCircle className="w-5 h-5" /></Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground mb-4">You haven't uploaded any videos yet.</p>
              <Link href="/upload"><Button>Upload a video</Button></Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Add UserIcon to imports
import { User as UserIcon } from "lucide-react";