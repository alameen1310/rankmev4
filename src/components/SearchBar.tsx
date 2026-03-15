import { useState, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(newValue), 300);
  }, [onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex items-center gap-2.5 h-10 px-3 rounded-lg bg-secondary border border-border transition-colors",
        isFocused && "border-primary/50 ring-1 ring-primary/20"
      )}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {value && (
          <button onClick={handleClear} className="p-1 rounded-full hover:bg-accent transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
