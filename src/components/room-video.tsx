import { useEffect } from "react";
import { MonitorPlay, Tv, MonitorUp, MonitorOff } from "lucide-react";
import type { RoomMode, VideoSync } from "@/lib/schema";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useScreenShare } from "@/hooks/useScreenShare";
import { Button } from "@/components/ui/button";

interface RoomVideoProps {
  mode: RoomMode;
  videoUrl?: string;
  isOwner: boolean;
  onVideoSync?: (syncData: VideoSync) => void;
  videoSyncEvent?: VideoSync | null;
}

export function RoomVideo({ mode, videoUrl, isOwner, onVideoSync, videoSyncEvent }: RoomVideoProps) {
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;

  const { playerContainerRef, isReady, syncVideo } = useYouTubePlayer({
    videoId: youtubeId,
    isOwner,
    onStateChange: (action, currentTime) => {
      if (isOwner && onVideoSync) {
        onVideoSync({
          action,
          currentTime,
          videoUrl,
        });
      }
    },
  });

  const { isSharing, error, startScreenShare, stopScreenShare, attachVideoElement } = useScreenShare();

  // Handle incoming video sync events (for non-owners)
  useEffect(() => {
    if (!isOwner && videoSyncEvent && isReady) {
      syncVideo(videoSyncEvent.action, videoSyncEvent.currentTime);
    }
  }, [isOwner, videoSyncEvent, isReady, syncVideo]);

  return (
    <div className="w-full bg-black rounded-md overflow-hidden" data-testid="room-video-container">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {mode === "watchparty" && youtubeId ? (
          <div 
            ref={playerContainerRef} 
            className="absolute inset-0 w-full h-full"
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
                      onClick={startScreenShare}
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
            <p className="text-lg" data-testid="text-video-waiting">
              No video playing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
