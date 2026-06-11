import { useListVideos } from "@workspace/api-client-react";
import { Link } from "wouter";
import { PlayCircle, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Videos() {
  const { data: videos, isLoading } = useListVideos();

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">Video Library</h1>
        <p className="text-lg text-muted-foreground">Explore high-quality educational content uploaded by our expert tutors.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl h-64 w-full" />
          ))}
        </div>
      ) : videos?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
          <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No videos yet</h3>
          <p className="text-muted-foreground">Be the first to upload an educational video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos?.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`}>
              <Card className="overflow-hidden hover-elevate transition-all border-border/50 group h-full cursor-pointer flex flex-col">
                <div className="aspect-video bg-muted relative overflow-hidden flex-shrink-0">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                      <PlayCircle className="w-12 h-12 text-secondary/40" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                    {video.duration || "10:00"}
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {video.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-0">{video.subject}</Badge>}
                    {video.level && <Badge variant="outline" className="border-border/50 text-muted-foreground">{video.level}</Badge>}
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">{video.title}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span className="truncate max-w-[100px]">{video.uploaderName}</span>
                    </div>
                    <span>{video.views} views</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}