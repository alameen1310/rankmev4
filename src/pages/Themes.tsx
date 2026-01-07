import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles, Lock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumTheme } from '@/themes/themeDefinitions';

type ThemeCategory = 'all' | 'vibrant' | 'pastel' | 'dark' | 'minimal';

export function Themes() {
  const navigate = useNavigate();
  const { premiumTheme, setPremiumTheme, availableThemes } = useTheme();
  const { isPremium, isDevMode } = usePremium();
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');
  const [previewTheme, setPreviewTheme] = useState<PremiumTheme | null>(null);

  const categories: { id: ThemeCategory; label: string; emoji: string }[] = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'vibrant', label: 'Vibrant', emoji: '🔥' },
    { id: 'pastel', label: 'Pastel', emoji: '🌸' },
    { id: 'dark', label: 'Dark', emoji: '🌙' },
    { id: 'minimal', label: 'Minimal', emoji: '⚪' },
  ];

  const filteredThemes = selectedCategory === 'all' 
    ? availableThemes 
    : availableThemes.filter(t => t.category === selectedCategory);

  const handleSelectTheme = (theme: PremiumTheme) => {
    if (theme.type === 'premium' && !isPremium && !isDevMode) {
      // Show upgrade prompt
      return;
    }
    setPremiumTheme(theme.id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="bg-gradient-to-r from-success/20 via-success/10 to-success/20 border-b border-success/30 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-success">Development Mode</p>
              <p className="text-xs text-muted-foreground">All premium themes unlocked for free!</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              App Themes
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalize your experience
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Current Theme Preview */}
        <Card className="p-4 bg-gradient-to-br from-card via-card to-muted/30 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">{premiumTheme.emoji}</div>
            <div className="flex-1">
              <p className="font-semibold">{premiumTheme.name}</p>
              <p className="text-xs text-muted-foreground capitalize">Current theme • {premiumTheme.category}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {premiumTheme.type}
            </Badge>
          </div>
          
          {/* Color Preview */}
          <div className="flex gap-1.5 mb-3">
            <div 
              className="w-10 h-10 rounded-lg shadow-sm ring-1 ring-border/50"
              style={{ background: premiumTheme.preview.primary }}
            />
            <div 
              className="w-10 h-10 rounded-lg shadow-sm ring-1 ring-border/50"
              style={{ background: premiumTheme.preview.secondary }}
            />
            <div 
              className="w-10 h-10 rounded-lg shadow-sm ring-1 ring-border/50"
              style={{ background: premiumTheme.preview.accent }}
            />
            <div 
              className="w-10 h-10 rounded-lg shadow-sm ring-1 ring-border/50"
              style={{ background: premiumTheme.preview.background }}
            />
          </div>

          {/* Mini Chat Preview */}
          <div className="bg-background rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
              <div className="bg-muted rounded-2xl rounded-tl-md px-3 py-1.5 text-sm max-w-[70%]">
                Hey! How's studying going? 📚
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-3 py-1.5 text-sm max-w-[70%]">
                Great! Just scored 95% 🎉
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredThemes.map(theme => {
            const isActive = theme.id === premiumTheme.id;
            const canUse = theme.type === 'free' || isPremium || isDevMode;
            
            return (
              <button
                key={theme.id}
                onClick={() => canUse && handleSelectTheme(theme)}
                className={cn(
                  "relative p-3 rounded-xl text-left transition-all border-2",
                  isActive 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : canUse
                      ? "border-border hover:border-primary/50 hover:shadow-sm bg-card"
                      : "border-border bg-card opacity-75"
                )}
              >
                {/* Premium Badge */}
                {theme.type === 'premium' && (
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    {canUse ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-warning to-amber-400 flex items-center justify-center shadow-sm">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shadow-sm">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Check */}
                {isActive && (
                  <div className="absolute -top-1.5 -left-1.5 z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                {/* Theme Info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{theme.emoji}</span>
                  <span className="font-medium text-sm truncate">{theme.name}</span>
                </div>

                {/* Color Swatches */}
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-md ring-1 ring-border/30"
                    style={{ background: theme.preview.primary }}
                  />
                  <div 
                    className="w-6 h-6 rounded-md ring-1 ring-border/30"
                    style={{ background: theme.preview.secondary }}
                  />
                  <div 
                    className="w-6 h-6 rounded-md ring-1 ring-border/30"
                    style={{ background: theme.preview.accent }}
                  />
                  <div 
                    className="w-6 h-6 rounded-md ring-1 ring-border/30"
                    style={{ background: theme.preview.background }}
                  />
                </div>

                {/* Category Tag */}
                <div className="mt-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full capitalize",
                    theme.isDark ? "bg-foreground/10 text-foreground/70" : "bg-muted text-muted-foreground"
                  )}>
                    {theme.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Upgrade CTA (only if not premium) */}
        {!isPremium && !isDevMode && (
          <Card className="p-4 bg-gradient-to-r from-warning/10 via-card to-warning/10 border-warning/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Unlock Premium Themes</p>
                <p className="text-sm text-muted-foreground">Get access to all vibrant themes</p>
              </div>
              <Button variant="default" size="sm" className="shrink-0">
                Upgrade
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
