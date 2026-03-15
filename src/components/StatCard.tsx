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
      <div className={cn("bg-card border border-border rounded-xl p-4 animate-pulse", className)}>
        <div className="w-5 h-5 bg-secondary rounded mb-2" />
        <div className="h-6 w-16 bg-secondary rounded mb-1" />
        <div className="h-3 w-12 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 game-card", className)}>
      <Icon className={cn("h-4 w-4 mb-2", iconColor)} />
      <div className="text-xl font-bold leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {subValue && (
        <div className="text-xs text-success font-medium mt-1">{subValue}</div>
      )}
    </div>
  );
};

export const StatCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
    <div className="w-5 h-5 bg-secondary rounded mb-2" />
    <div className="h-6 w-16 bg-secondary rounded mb-1" />
    <div className="h-3 w-12 bg-secondary rounded" />
  </div>
);
