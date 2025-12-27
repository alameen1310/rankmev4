import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export const FilterChips = ({
  options,
  selected,
  onChange,
  multiSelect = false,
  className,
}: FilterChipsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    if (multiSelect) {
      if (selected.includes(id)) {
        onChange(selected.filter(s => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scroll-x pb-1 -mx-1 px-1"
      >
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full",
              "bg-destructive/10 text-destructive text-sm font-medium",
              "hover:bg-destructive/20 transition-colors touch-target"
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        )}

        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full",
                "text-sm font-medium transition-all duration-200",
                "touch-target",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/60 text-foreground hover:bg-accent"
              )}
            >
              {option.icon && <span className="text-base">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};