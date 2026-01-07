import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing?: boolean;
  status?: 'idle' | 'success' | 'error';
  message?: string;
  autoCapture?: boolean;
  interval?: number;
}

export const WebcamCapture = ({
  onCapture,
  isProcessing = false,
  status = 'idle',
  message,
  autoCapture = false,
  interval = 2000
}: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleVideoLoaded = () => {
    setIsCameraReady(true);
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageData);
  }, [isCameraReady, onCapture]);

  // Auto-capture effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoCapture && isCameraReady && !isProcessing && status !== 'success') {
      intervalId = setInterval(() => {
        captureImage();
      }, interval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoCapture, isCameraReady, isProcessing, status, captureImage, interval]);

  if (hasPermission === false) {
    return (
      <div className="webcam-container aspect-video flex flex-col items-center justify-center p-8">
        <XCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Camera Access Required</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Please allow camera access to use face recognition attendance.
        </p>
        <Button onClick={startCamera} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "webcam-container aspect-video relative",
          isProcessing && "animate-pulse-ring"
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={handleVideoLoaded}
          className="w-full h-full object-cover rounded-2xl"
        />

        {/* Face detection overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "w-48 h-64 border-2 rounded-[40%] transition-colors duration-300",
              status === 'success' && "border-success bg-success/10",
              status === 'error' && "border-destructive bg-destructive/10",
              status === 'idle' && "border-primary/50 border-dashed"
            )}
          />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="webcam-overlay">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="mt-3 text-sm font-medium text-foreground">Verifying face...</p>
            </div>
          </div>
        )}

        {/* Success/Error overlay */}
        {status !== 'idle' && !isProcessing && (
          <div className="webcam-overlay">
            <div className="text-center">
              {status === 'success' ? (
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
              ) : (
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
              )}
              {message && (
                <p className={cn(
                  "mt-3 text-sm font-medium",
                  status === 'success' ? "text-success" : "text-destructive"
                )}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading camera */}
        {!isCameraReady && hasPermission === null && (
          <div className="webcam-overlay">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <Button
        onClick={captureImage}
        disabled={!isCameraReady || isProcessing}
        className="w-full h-14 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5 mr-2" />
            Capture & Mark Attendance
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Position your face within the oval frame for best results
      </p>
    </div>
  );
};
