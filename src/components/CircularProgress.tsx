import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  showValue?: boolean;
  icon?: LucideIcon;
  label?: string;
  color?: 'primary' | 'success' | 'warning';
  className?: string;
}

export const CircularProgress = ({
  value,
  max = 100,
  size = 'md',
  strokeWidth = 4,
  showValue = true,
  icon: Icon,
  label,
  color = 'primary',
  className,
}: CircularProgressProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: { diameter: 48, fontSize: 'text-xs' },
    md: { diameter: 72, fontSize: 'text-sm' },
    lg: { diameter: 96, fontSize: 'text-base' },
  };

  const colors = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
  };

  const { diameter, fontSize } = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: diameter, height: diameter }}>
        {/* Background circle */}
        <svg
          width={diameter}
          height={diameter}
          className="transform -rotate-90"
        >
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/50"
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={cn(colors[color], "transition-all duration-500 ease-out")}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Icon ? (
            <Icon className={cn("h-1/3 w-1/3", colors[color].replace('stroke-', 'text-'))} />
          ) : showValue ? (
            <span className={cn("font-bold", fontSize)}>
              {Math.round(percentage)}%
            </span>
          ) : null}
        </div>
      </div>

      {label && (
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      )}
    </div>
  );
};