import { useParams } from "wouter";
import { useGetVideo, getGetVideoQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Clock, Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export function VideoDetail() {
  const params = useParams();
  const videoId = parseInt(params.id || "0", 10);

  const { data: video, isLoading } = useGetVideo(videoId, {
    query: { enabled: !!videoId, queryKey: getGetVideoQueryKey(videoId) }
  });

  if (isLoading) return <div className="p-12 text-center">Loading video...</div>;
  if (!video) return <div className="p-12 text-center text-destructive">Video not found</div>;

  // Simple check for youtube embed
  const isYouTube = video.videoUrl.includes("youtube.com") || video.videoUrl.includes("youtu.be");
  let embedUrl = video.videoUrl;
  
  if (isYouTube) {
    const videoIdMatch = video.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="bg-black aspect-video w-full rounded-2xl overflow-hidden mb-8 shadow-lg">
        {isYouTube ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
          />
        ) : (
          <video 
            src={video.videoUrl} 
            controls 
            className="w-full h-full"
            poster={video.thumbnailUrl || undefined}
          />
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {video.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">{video.subject}</Badge>}
          {video.level && <Badge variant="outline">{video.level}</Badge>}
        </div>
        
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-primary mb-4">{video.title}</h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b border-border/40 pb-6 mb-6">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{video.views} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{video.duration || "Unknown duration"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(video.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {video.uploaderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-lg text-primary">{video.uploaderName}</div>
            <div className="text-sm text-muted-foreground capitalize">{video.uploaderRole}</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {video.description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}