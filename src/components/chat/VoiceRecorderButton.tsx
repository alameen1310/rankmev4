import { useState, useEffect } from 'react';
import { Mic, X, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderButtonProps {
  onSend: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({ onSend, disabled }: VoiceRecorderButtonProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  } = useVoiceRecorder({
    maxDuration: 120,
    onRecordingComplete: (blob, dur) => {
      onSend(blob, dur);
      setShowRecorder(false);
    },
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setShowRecorder(true);
    await startRecording();
  };

  const handleCancel = () => {
    cancelRecording();
    setShowRecorder(false);
  };

  const handleSend = () => {
    stopRecording();
  };

  if (showRecorder) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/20 animate-in slide-in-from-left">
        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/20"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Recording Indicator */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(duration)}
          </span>
          {error && (
            <span className="text-xs text-destructive/70">{error}</span>
          )}
        </div>

        {/* Waveform visualization placeholder */}
        <div className="flex items-center gap-0.5 h-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-destructive rounded-full transition-all"
              style={{
                height: isRecording 
                  ? `${Math.random() * 16 + 8}px` 
                  : '4px',
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* Send Button */}
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 bg-primary hover:bg-primary/90"
          onClick={handleSend}
          disabled={duration < 1}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={handleStartRecording}
      disabled={disabled}
      title="Record voice note"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}
