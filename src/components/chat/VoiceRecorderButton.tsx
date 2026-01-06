import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useRealtimeAudioVisualizer } from '@/hooks/useAudioWaveform';

interface VoiceRecorderButtonProps {
  onSend: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({ onSend, disabled }: VoiceRecorderButtonProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { levels, startVisualization, stopVisualization } = useRealtimeAudioVisualizer(25);
  
  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    stopVisualization();
    onSend(blob, duration);
    setShowRecorder(false);
    streamRef.current = null;
  }, [onSend, stopVisualization]);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  } = useVoiceRecorder({
    maxDuration: 120,
    onRecordingComplete: handleRecordingComplete,
  });

  const handleStartRecording = async () => {
    setShowRecorder(true);
    
    try {
      // Get the stream first for visualization
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      startVisualization(stream);
      
      // Then start the actual recording
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setShowRecorder(false);
    }
  };

  const handleCancel = () => {
    stopVisualization();
    cancelRecording();
    setShowRecorder(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStop = () => {
    stopRecording();
    // Visualization will be stopped in handleRecordingComplete
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopVisualization]);

  if (showRecorder) {
    return (
      <div className="fixed bottom-20 left-2 right-2 z-50 bg-card rounded-2xl shadow-xl border p-4"
           style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        {error ? (
          <div className="text-center">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <Button variant="outline" onClick={handleCancel}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recording indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="font-medium text-destructive">Recording</span>
              </div>
              <span className="font-mono text-lg">{formatDuration(duration)}</span>
            </div>

            {/* Real-time waveform visualization */}
            <div className="h-12 flex items-center justify-center gap-[3px] px-4">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full transition-all duration-75"
                  style={{ 
                    height: `${Math.max(4, level * 44)}px`,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Cancel */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full text-destructive hover:bg-destructive/10"
                onClick={handleCancel}
              >
                <Trash2 className="w-5 h-5" />
              </Button>

              {/* Stop & Send */}
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
                onClick={handleStop}
              >
                <Send className="w-6 h-6" />
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Tap send when done • Max 2 minutes
            </p>
          </div>
        )}
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
