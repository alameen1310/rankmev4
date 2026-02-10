import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
  className?: string;
  isLoading?: boolean;
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = 'text-primary',
  className,
  isLoading = false,
}: StatCardProps) => {
  if (isLoading) {
    return (
      <div className={cn(
        "glass rounded-xl p-6 min-h-[140px] flex flex-col justify-between relative overflow-hidden shadow-md",
        className
      )}>
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-muted/50 animate-pulse" />
        <div className="w-6 h-6 bg-muted/50 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "glass rounded-xl p-6 min-h-[140px] flex flex-col justify-between relative overflow-hidden",
      "shadow-md game-card game-tap",
      className
    )}>
      {/* Background icon */}
      <div className="absolute top-4 right-4 opacity-[0.08]">
        <Icon className="w-12 h-12" />
      </div>
      
      <Icon className={cn("h-5 w-5 relative z-10", iconColor)} />
      
      <div className="relative z-10">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {subValue && (
          <div className="text-xs text-success font-medium mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
};

export const StatCardSkeleton = () => (
  <div className="glass rounded-xl p-6 min-h-[140px] flex flex-col justify-between relative overflow-hidden shadow-md animate-pulse">
    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-muted/50" />
    <div className="w-6 h-6 bg-muted/50 rounded" />
    <div className="space-y-2">
      <div className="h-8 w-20 bg-muted/50 rounded" />
      <div className="h-4 w-16 bg-muted/50 rounded" />
    </div>
  </div>
);
