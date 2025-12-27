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
    <div className={cn(
      "glass rounded-xl p-4 min-h-[120px] flex flex-col justify-between",
      className
    )}>
      <Icon className={cn("h-5 w-5", iconColor)} />
      <div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {subValue && (
          <div className="text-xs text-success font-medium mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
};