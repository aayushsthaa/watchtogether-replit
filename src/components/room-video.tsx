import { useEffect, useState } from "react";
import { MonitorPlay, Tv, MonitorUp, MonitorOff } from "lucide-react";
import type { RoomMode, VideoSync, PlaylistEntry } from "@/lib/schema";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useScreenShare } from "@/hooks/useScreenShare";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoomVideoProps {
  mode: RoomMode;
  videoUrl?: string;
  playlist?: PlaylistEntry[];
  currentIndex?: number;
  isOwner: boolean;
  onVideoSync?: (syncData: VideoSync) => void;
  videoSyncEvent?: VideoSync | null;
}

export function RoomVideo({ mode, videoUrl, playlist = [], currentIndex = 0, isOwner, onVideoSync, videoSyncEvent }: RoomVideoProps) {
  const [shareAudioDialogOpen, setShareAudioDialogOpen] = useState(false);
  const [shareAudio, setShareAudio] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  // Get current video from playlist or fallback to videoUrl prop
  const currentVideoUrl = playlist.length > 0 && playlist[currentIndex] 
    ? playlist[currentIndex].url 
    : videoUrl;

  const youtubeId = currentVideoUrl ? getYouTubeId(currentVideoUrl) : null;

  const { playerId, isReady, syncVideo } = useYouTubePlayer({
    videoId: youtubeId,
    isOwner,
    onStateChange: (action, currentTime) => {
      if (isOwner && onVideoSync) {
        console.log('Sending sync event:', action, 'at', currentTime);
        onVideoSync({
          action,
          currentTime,
          videoUrl: currentVideoUrl,
        });
      }
    },
  });

  const { isSharing, error, startScreenShare, stopScreenShare, attachVideoElement } = useScreenShare();

  const handleStartScreenShare = () => {
    setShareAudioDialogOpen(true);
  };

  const confirmStartScreenShare = async () => {
    await startScreenShare(shareAudio);
    setShareAudioDialogOpen(false);
    setShareAudio(false);
  };

  // Handle incoming video sync events (for non-owners)
  useEffect(() => {
    if (!isOwner && videoSyncEvent && isReady) {
      console.log('Received sync event:', videoSyncEvent.action, 'at', videoSyncEvent.currentTime);
      syncVideo(videoSyncEvent.action, videoSyncEvent.currentTime);
    }
  }, [isOwner, videoSyncEvent, isReady, syncVideo]);

  return (
    <div className="w-full bg-black rounded-md overflow-hidden" data-testid="room-video-container">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {mode === "watchparty" && youtubeId ? (
          <div 
            id={playerId}
            className={`absolute inset-0 w-full h-full ${!isOwner ? 'pointer-events-none' : ''}`}
            data-testid="youtube-player"
          />
        ) : mode === "screenshare" ? (
          <>
            {isSharing ? (
              <video
                ref={attachVideoElement}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                data-testid="screenshare-video"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <MonitorPlay className="h-16 w-16" />
                {isOwner ? (
                  <>
                    <p className="text-lg" data-testid="text-screenshare-prompt">
                      Share your screen with the room
                    </p>
                    <Button
                      onClick={handleStartScreenShare}
                      className="gap-2"
                      data-testid="button-start-screenshare"
                    >
                      <MonitorUp className="h-5 w-5" />
                      Start Screen Share
                    </Button>
                    {error && (
                      <p className="text-sm text-destructive" data-testid="text-screenshare-error">
                        {error}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-lg" data-testid="text-screenshare-waiting">
                    Waiting for owner to share screen...
                  </p>
                )}
              </div>
            )}
            {isSharing && isOwner && (
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  onClick={stopScreenShare}
                  variant="destructive"
                  className="gap-2"
                  data-testid="button-stop-screenshare"
                >
                  <MonitorOff className="h-5 w-5" />
                  Stop Sharing
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Tv className="h-16 w-16" />
            {isOwner ? (
              <p className="text-lg" data-testid="text-video-waiting">
                No videos in playlist. Add a video to get started.
              </p>
            ) : (
              <p className="text-lg" data-testid="text-video-waiting">
                Waiting for owner to add videos...
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog open={shareAudioDialogOpen} onOpenChange={setShareAudioDialogOpen}>
        <DialogContent data-testid="dialog-screenshare-options">
          <DialogHeader>
            <DialogTitle>Screen Share Options</DialogTitle>
            <DialogDescription>
              Configure your screen sharing preferences
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Switch
              id="share-audio"
              checked={shareAudio}
              onCheckedChange={setShareAudio}
              data-testid="switch-share-audio"
            />
            <Label htmlFor="share-audio" className="cursor-pointer">
              Share system audio (browser tab audio)
            </Label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareAudioDialogOpen(false)}
              data-testid="button-cancel-screenshare"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStartScreenShare}
              data-testid="button-confirm-screenshare"
            >
              Start Sharing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
