import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioWaveformData {
  samples: number[];
  duration: number;
}

export function useAudioWaveform(sampleCount: number = 50) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Analyze audio file and generate waveform
  const analyzeAudioFile = useCallback(async (audioUrl: string): Promise<AudioWaveformData> => {
    setIsAnalyzing(true);
    
    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Fetch audio data
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // Left channel
      
      // Sample the waveform
      const sampleSize = Math.floor(channelData.length / sampleCount);
      const samples: number[] = [];
      
      for (let i = 0; i < sampleCount; i++) {
        let sum = 0;
        const startIndex = i * sampleSize;
        
        for (let j = 0; j < sampleSize; j++) {
          const index = startIndex + j;
          if (index < channelData.length) {
            sum += Math.abs(channelData[index]);
          }
        }
        
        // Normalize to 0-1 range
        const avg = sum / sampleSize;
        samples.push(Math.min(avg * 3, 1)); // Amplify and cap at 1
      }
      
      setWaveform(samples);
      setIsAnalyzing(false);
      
      return {
        samples,
        duration: audioBuffer.duration,
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      setIsAnalyzing(false);
      // Return fake waveform on error
      const fakeSamples = Array(sampleCount).fill(0).map(() => Math.random() * 0.5 + 0.1);
      setWaveform(fakeSamples);
      return { samples: fakeSamples, duration: 0 };
    }
  }, [sampleCount]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    waveform,
    isAnalyzing,
    analyzeAudioFile,
  };
}

// Real-time audio visualization during recording
export function useRealtimeAudioVisualizer(barCount: number = 25) {
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0.1));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startVisualization = useCallback((stream: MediaStream) => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;
      
      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Buffer for frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Animation loop
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate levels for each bar
        const step = Math.floor(bufferLength / barCount);
        const newLevels: number[] = [];
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          // Normalize to 0-1 and add minimum height
          const level = Math.max(0.1, sum / (step * 255));
          newLevels.push(level);
        }
        
        setLevels(newLevels);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.error('Error starting audio visualization:', error);
    }
  }, [barCount]);

  const stopVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setLevels(Array(barCount).fill(0.1));
  }, [barCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, [stopVisualization]);

  return {
    levels,
    startVisualization,
    stopVisualization,
  };
}
