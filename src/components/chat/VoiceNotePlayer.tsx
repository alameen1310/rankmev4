import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceNotePlayerProps {
  url: string;
  duration?: number;
  isOwn?: boolean;
}

export function VoiceNotePlayer({ url, duration = 0, isOwn }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * totalDuration;
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 min-w-[180px]",
    )}>
      <audio ref={audioRef} src={url} preload="metadata" />
      
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full shrink-0",
          isOwn 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Waveform/Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <div 
          className="relative h-6 flex items-center gap-0.5 cursor-pointer"
          onClick={handleSeek}
        >
          {/* Waveform bars */}
          {Array.from({ length: 25 }).map((_, i) => {
            const barProgress = (i / 25) * 100;
            const isActive = barProgress <= progress;
            const height = Math.sin((i / 25) * Math.PI * 3) * 12 + 8;
            
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-colors",
                  isActive
                    ? isOwn ? "bg-primary-foreground" : "bg-primary"
                    : isOwn ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                )}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Time and Speed */}
        <div className="flex items-center justify-between text-[10px]">
          <span className={isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <button
            onClick={cyclePlaybackRate}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
              isOwn 
                ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
