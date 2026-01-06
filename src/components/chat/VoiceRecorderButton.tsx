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
      <div 
        className="fixed bottom-20 left-2 right-2 flex items-center gap-2 px-3 py-3 bg-card rounded-xl border shadow-lg animate-in slide-in-from-bottom z-[70]"
        style={{ 
          maxWidth: 'calc(100vw - 1rem)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/20"
          onClick={handleCancel}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Recording Indicator */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse shrink-0" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(duration)}
          </span>
          {error && (
            <span className="text-xs text-destructive/70 truncate">{error}</span>
          )}
        </div>

        {/* Waveform visualization */}
        <div className="flex items-center gap-0.5 h-8 shrink-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-destructive rounded-full transition-all"
              style={{
                height: isRecording 
                  ? `${Math.random() * 20 + 8}px` 
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
          className="h-9 w-9 shrink-0"
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
      className="h-8 w-8 shrink-0"
      onClick={handleStartRecording}
      disabled={disabled}
      title="Record voice note"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}
