import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
  className?: string;
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = 'text-primary',
  className,
}: StatCardProps) => {
  return (
    <div className={cn("glass rounded-xl p-4", className)}>
      <Icon className={cn("h-5 w-5 mb-2", iconColor)} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {subValue && (
        <div className="text-xs text-success mt-1">{subValue}</div>
      )}
    </div>
  );
};
