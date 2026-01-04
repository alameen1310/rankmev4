import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// GIPHY API - using the public beta key (you can replace with your own)
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
const GIPHY_LIMIT = 20;

interface Gif {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gif: Gif) => void;
  onClose: () => void;
  className?: string;
}

export function GifPicker({ onSelect, onClose, className }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Fetch trending GIFs on mount
  useEffect(() => {
    fetchTrending();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchGifs(searchQuery);
      }, 300);
    } else {
      fetchTrending();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIPHY_LIMIT}&rating=g`
      );
      const data = await response.json();
      setGifs(parseGiphyResponse(data));
    } catch (err) {
      setError('Failed to load GIFs');
      console.error('GIPHY fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${GIPHY_LIMIT}&rating=g`
      );
      const data = await response.json();
      setGifs(parseGiphyResponse(data));
    } catch (err) {
      setError('Failed to search GIFs');
      console.error('GIPHY search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseGiphyResponse = (data: any): Gif[] => {
    return (data.data || []).map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.fixed_height.url,
      preview: gif.images.fixed_height_small.url || gif.images.fixed_height.url,
      width: parseInt(gif.images.fixed_height.width),
      height: parseInt(gif.images.fixed_height.height),
    }));
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute bottom-12 left-0 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-semibold text-sm">GIFs</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* GIF Grid */}
      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full py-8 text-sm text-muted-foreground">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 p-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif)}
                className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* GIPHY Attribution */}
      <div className="p-2 border-t border-border text-center">
        <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
      </div>
    </div>
  );
}
