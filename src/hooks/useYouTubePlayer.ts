import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId: string | null;
  isOwner: boolean;
  onStateChange?: (action: 'play' | 'pause' | 'seek', currentTime: number) => void;
}

export function useYouTubePlayer({ videoId, isOwner, onStateChange }: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const lastActionRef = useRef<{ action: string; time: number } | null>(null);
  const isSyncingRef = useRef(false);
  const playerIdRef = useRef(`youtube-player-${Math.random().toString(36).substr(2, 9)}`);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !videoId) {
      return;
    }

    const playerId = playerIdRef.current;
    const containerElement = document.getElementById(playerId);
    
    if (!containerElement) {
      console.error('YouTube player container not found:', playerId);
      return;
    }

    // Clean up existing player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // Create new player with element ID string
    playerRef.current = new window.YT.Player(playerId, {
      height: '100%',
      width: '100%',
      videoId,
      playerVars: {
        autoplay: 0,
        controls: isOwner ? 1 : 0,
        disablekb: isOwner ? 0 : 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        playsinline: 1,
        widget_referrer: window.location.href,
      },
      events: {
        onReady: () => {
          console.log('YouTube player ready, isOwner:', isOwner);
          setIsReady(true);
        },
        onStateChange: (event: any) => {
          if (isSyncingRef.current || !isOwner) {
            return;
          }

          const currentTime = playerRef.current?.getCurrentTime() || 0;
          
          // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (event.data === window.YT.PlayerState.PLAYING) {
            const lastAction = lastActionRef.current;
            const timeDiff = lastAction ? Math.abs(currentTime - lastAction.time) : 0;
            
            // Only send play event if it's a new play or significant time difference
            if (!lastAction || lastAction.action !== 'play' || timeDiff > 1) {
              lastActionRef.current = { action: 'play', time: currentTime };
              console.log('Owner playing video at', currentTime);
              onStateChange?.('play', currentTime);
            }
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            const lastAction = lastActionRef.current;
            
            // Only send pause event if last action wasn't pause
            if (!lastAction || lastAction.action !== 'pause') {
              lastActionRef.current = { action: 'pause', time: currentTime };
              console.log('Owner paused video at', currentTime);
              onStateChange?.('pause', currentTime);
            }
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPIReady, videoId, isOwner, onStateChange]);

  const syncVideo = useCallback((action: 'play' | 'pause' | 'seek', currentTime: number) => {
    if (!playerRef.current || !isReady) {
      return;
    }

    console.log('Syncing video:', action, 'at', currentTime);
    isSyncingRef.current = true;

    try {
      const playerCurrentTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(playerCurrentTime - currentTime);

      // Always seek if time difference is significant (more than 2 seconds)
      if (timeDiff > 2) {
        playerRef.current.seekTo(currentTime, true);
      }

      // Apply the action
      if (action === 'play') {
        playerRef.current.playVideo();
      } else if (action === 'pause') {
        playerRef.current.pauseVideo();
      } else if (action === 'seek') {
        playerRef.current.seekTo(currentTime, true);
      }

      lastActionRef.current = { action, time: currentTime };
    } finally {
      // Reset sync flag after a short delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    }
  }, [isReady]);

  const play = useCallback(() => {
    if (!playerRef.current || !isReady || !isOwner) return;
    playerRef.current.playVideo();
  }, [isReady, isOwner]);

  const pause = useCallback(() => {
    if (!playerRef.current || !isReady || !isOwner) return;
    playerRef.current.pauseVideo();
  }, [isReady, isOwner]);

  const seekTo = useCallback((time: number) => {
    if (!playerRef.current || !isReady || !isOwner) return;
    playerRef.current.seekTo(time, true);
    const currentTime = playerRef.current.getCurrentTime();
    onStateChange?.('seek', currentTime);
  }, [isReady, isOwner, onStateChange]);

  return {
    playerId: playerIdRef.current,
    isReady,
    syncVideo,
    play,
    pause,
    seekTo,
  };
}
