import { useEffect } from "react";
import { MonitorPlay, Tv } from "lucide-react";
import type { RoomMode, VideoSync } from "@/lib/schema";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

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
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            {mode === "screenshare" ? (
              <>
                <MonitorPlay className="h-16 w-16" />
                <p className="text-lg" data-testid="text-screenshare-waiting">
                  Waiting for screen share...
                </p>
              </>
            ) : (
              <>
                <Tv className="h-16 w-16" />
                <p className="text-lg" data-testid="text-video-waiting">
                  No video playing
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
