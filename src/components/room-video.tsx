import { MonitorPlay, Tv } from "lucide-react";
import type { RoomMode } from "@/lib/schema";

interface RoomVideoProps {
  mode: RoomMode;
  videoUrl?: string;
}

export function RoomVideo({ mode, videoUrl }: RoomVideoProps) {
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div className="w-full bg-black rounded-md overflow-hidden" data-testid="room-video-container">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {mode === "watchparty" && youtubeId ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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
