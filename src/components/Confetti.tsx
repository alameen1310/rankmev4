import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

const colors = [
  'hsl(231, 83%, 60%)',  // Primary blue
  'hsl(160, 84%, 39%)',  // Success green
  'hsl(38, 92%, 50%)',   // Warning gold
  'hsl(280, 100%, 70%)', // Purple
  'hsl(189, 100%, 86%)', // Diamond blue
];

export const Confetti = ({
  isActive,
  duration = 3000,
  particleCount = 50,
}: ConfettiProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    size: number;
    rotation: number;
  }>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${2 + Math.random()}s`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};