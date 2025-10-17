import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertPlaylistEntrySchema, type Room, type InsertPlaylistEntry } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PlaylistManagerProps {
  room: Room;
  isOwner: boolean;
}

export function PlaylistManager({ room, isOwner }: PlaylistManagerProps) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<InsertPlaylistEntry>({
    resolver: zodResolver(insertPlaylistEntrySchema),
    defaultValues: {
      url: "",
      title: "",
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: (data: InsertPlaylistEntry) => api.rooms.addToPlaylist(room._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room._id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      form.reset();
      setShowAddForm(false);
      toast({
        title: "Video added",
        description: "Video has been added to the playlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add video to playlist",
        variant: "destructive",
      });
    },
  });

  const removeFromPlaylistMutation = useMutation({
    mutationFn: (entryId: string) => api.rooms.removeFromPlaylist(room._id, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room._id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Video removed",
        description: "Video has been removed from the playlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove video",
        variant: "destructive",
      });
    },
  });

  const nextVideoMutation = useMutation({
    mutationFn: () => api.rooms.nextVideo(room._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room._id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to skip to next video",
        variant: "destructive",
      });
    },
  });

  const previousVideoMutation = useMutation({
    mutationFn: () => api.rooms.previousVideo(room._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room._id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to go to previous video",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlaylistEntry) => {
    addToPlaylistMutation.mutate(data);
  };

  const extractVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      return urlObj.hostname;
    } catch {
      return 'Video';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Playlist ({room.playlist?.length || 0})</span>
          {isOwner && !showAddForm && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              data-testid="button-show-add-video"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Video
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
        {isOwner && showAddForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 border rounded-lg p-3">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        {...field}
                        data-testid="input-video-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Video title"
                        {...field}
                        data-testid="input-video-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={addToPlaylistMutation.isPending}
                  data-testid="button-add-video"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    form.reset();
                  }}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}

        {isOwner && room.playlist && room.playlist.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => previousVideoMutation.mutate()}
              disabled={previousVideoMutation.isPending || room.playlist.length === 0}
              data-testid="button-previous-video"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => nextVideoMutation.mutate()}
              disabled={nextVideoMutation.isPending || room.playlist.length === 0}
              data-testid="button-next-video"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {!room.playlist || room.playlist.length === 0 ? (
            <div className="text-center text-muted-foreground py-8" data-testid="text-empty-playlist">
              {isOwner ? "No videos yet. Add a video to get started!" : "Playlist is empty"}
            </div>
          ) : (
            <div className="space-y-2" data-testid="list-playlist">
              {room.playlist.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${
                    index === room.currentIndex
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                  data-testid={`playlist-item-${entry.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        {index === room.currentIndex && (
                          <Play className="h-3 w-3 text-primary" data-testid="icon-now-playing" />
                        )}
                      </div>
                      <p className="font-medium truncate" data-testid={`text-video-title-${entry.id}`}>
                        {entry.title || extractVideoTitle(entry.url)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-video-url-${entry.id}`}>
                        {entry.url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added by {entry.addedByUsername}
                      </p>
                    </div>
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromPlaylistMutation.mutate(entry.id)}
                        disabled={removeFromPlaylistMutation.isPending}
                        data-testid={`button-remove-${entry.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
