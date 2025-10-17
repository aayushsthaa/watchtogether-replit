import { useState, useCallback, useRef, useEffect } from 'react';

export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startScreenShare = useCallback(async (shareAudio: boolean = false) => {
    try {
      setError(null);
      
      // Request screen sharing with the browser's native picker
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: shareAudio,
      });

      streamRef.current = stream;
      setIsSharing(true);

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      // Attach stream to video element if ref is set
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Screen sharing permission denied'
        : err.name === 'NotSupportedError'
        ? 'Audio sharing is not supported in your browser'
        : 'Failed to start screen sharing';
      setError(errorMessage);
      setIsSharing(false);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSharing(false);
  }, []);

  const attachVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return {
    isSharing,
    error,
    startScreenShare,
    stopScreenShare,
    attachVideoElement,
  };
}
