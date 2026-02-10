import { cn } from '@/lib/utils';
import type { SubjectInfo } from '@/types';

interface SubjectCardProps {
  subject: SubjectInfo;
  onClick: () => void;
  userProgress?: number;
  highScore?: number;
  className?: string;
}

export const SubjectCard = ({ 
  subject, 
  onClick, 
  userProgress = 0,
  highScore,
  className 
}: SubjectCardProps) => {
  const progressPercent = Math.min(userProgress, 100);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
        "glass game-card game-tap",
        "min-h-[140px] w-full touch-target",
        className
      )}
    >
      {/* Background color accent */}
      <div className={cn(
        "absolute inset-0 opacity-5 transition-opacity group-hover:opacity-15",
        subject.color
      )} />
      
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon with progress ring */}
        <div className="relative w-12 h-12 mb-3">
          {userProgress > 0 && (
            <svg
              className="absolute inset-0 -rotate-90"
              width="48"
              height="48"
              viewBox="0 0 48 48"
            >
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="text-success transition-all duration-700 ease-out"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{subject.icon}</span>
          </div>
        </div>

        {/* Subject info */}
        <div className="flex-1">
          <h3 className="font-bold text-base mb-0.5 leading-tight">{subject.name}</h3>
          <p className="text-xs text-muted-foreground">
            {subject.questionsCount} questions
          </p>
        </div>

        {/* High score badge */}
        {highScore && highScore > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs">🏆</span>
            <span className="text-xs font-medium text-warning">{highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Difficulty indicator dot */}
        <div className={cn(
          "absolute top-3 right-3 w-2 h-2 rounded-full transition-all group-hover:scale-150",
          subject.color
        )} />
      </div>
    </button>
  );
};
