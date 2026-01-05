import { useState } from 'react';
import { X, Download, Play, Pause, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MediaViewerProps {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  onClose: () => void;
}

export function MediaViewer({ type, url, thumbnailUrl, fileName, onClose }: MediaViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || `media-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success('Saved to downloads');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
      >
        <Download className="w-6 h-6" />
      </Button>

      {/* Media Content */}
      <div 
        className="max-w-full max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' ? (
          <img
            src={url}
            alt="Full size"
            className={cn(
              "max-w-full max-h-[90vh] object-contain rounded-lg transition-opacity",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
            onLoadedData={() => setIsLoading(false)}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// Inline media preview for chat messages
interface MediaMessageProps {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  isOwn?: boolean;
  onClick?: () => void;
}

export function MediaMessage({ 
  type, 
  url, 
  thumbnailUrl, 
  width, 
  height, 
  duration,
  isOwn,
  onClick 
}: MediaMessageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate aspect ratio for sizing
  const aspectRatio = width && height ? width / height : 16 / 9;
  const maxWidth = 240;
  const displayWidth = Math.min(width || maxWidth, maxWidth);
  const displayHeight = displayWidth / aspectRatio;

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg",
        "bg-muted/50 text-muted-foreground text-sm"
      )}
      style={{ width: displayWidth, height: displayHeight }}
      >
        Failed to load {type}
      </div>
    );
  }

  return (
    <div 
      className="relative cursor-pointer group overflow-hidden rounded-lg"
      style={{ width: displayWidth, maxHeight: 300 }}
      onClick={onClick}
    >
      {type === 'image' ? (
        <img
          src={url}
          alt="Shared image"
          className={cn(
            "w-full h-full object-cover transition-opacity",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      ) : (
        <>
          <img
            src={thumbnailUrl || url}
            alt="Video thumbnail"
            className={cn(
              "w-full h-full object-cover",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary ml-0.5" />
            </div>
          </div>
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
              {formatDuration(duration)}
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted/50 flex items-center justify-center"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Expand icon on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
          <Maximize2 className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}
