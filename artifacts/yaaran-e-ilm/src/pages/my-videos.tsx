import { useGetMyVideos, useDeleteVideo, getGetMyVideosQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Trash2, Edit } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MyVideos() {
  const { data: videos, isLoading } = useGetMyVideos();
  const deleteVideo = useDeleteVideo();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    deleteVideo.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Video deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMyVideosQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to delete video" });
      }
    });
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">My Videos</h1>
          <p className="text-lg text-muted-foreground">Manage the educational content you've uploaded.</p>
        </div>
        <Link href="/upload"><Button>Upload New</Button></Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-muted h-64 rounded-xl" />)}
        </div>
      ) : videos?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
          <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-6">You haven't uploaded any videos.</p>
          <Link href="/upload"><Button>Upload First Video</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {videos?.map(video => (
            <Card key={video.id} className="overflow-hidden border-border/50 flex flex-col">
              <div className="aspect-video bg-muted relative">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                    <PlayCircle className="w-12 h-12 text-secondary/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove your video from Yaaran E Ilm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(video.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {deleteVideo.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{video.subject}</Badge>
                </div>
                <h4 className="font-bold mb-2 flex-1 line-clamp-2">{video.title}</h4>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t border-border/40">
                  <span>{video.views} views</span>
                  <Link href={`/videos/${video.id}`}>
                    <Button variant="ghost" size="sm" className="h-8">Watch</Button>
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