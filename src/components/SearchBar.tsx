import { useState, useCallback, useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  showFilters?: boolean;
  onFilterClick?: () => void;
  className?: string;
  value?: string;
}

export const SearchBar = ({
  placeholder = "Search...",
  onSearch,
  showFilters = false,
  onFilterClick,
  className,
  value: controlledValue,
}: SearchBarProps) => {
  const [value, setValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 300);
  }, [onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 flex items-center gap-3 h-12 px-4 rounded-xl",
          "bg-card border border-border/60",
          "transition-all duration-200",
          isFocused && "border-primary/50 ring-2 ring-primary/20"
        )}
      >
        <Search className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none",
            "placeholder:text-muted-foreground/70"
          )}
        />

        {value && (
          <button
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-muted transition-colors touch-target"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showFilters && (
        <button
          onClick={onFilterClick}
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            "bg-card border border-border/60",
            "hover:bg-accent transition-colors touch-target"
          )}
        >
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};