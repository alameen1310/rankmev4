import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Flame, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SocialEvent {
  id: string;
  icon: React.ReactNode;
  text: string;
  color: string;
}

const EVENT_TEMPLATES = [
  { icon: <Trophy className="w-4 h-4" />, text: '{name} just ranked up!', color: 'text-yellow-500' },
  { icon: <Swords className="w-4 h-4" />, text: '{name} won a duel!', color: 'text-primary' },
  { icon: <Flame className="w-4 h-4" />, text: '{name} is on a {n}-day streak!', color: 'text-orange-500' },
  { icon: <Star className="w-4 h-4" />, text: '{name} earned a new badge!', color: 'text-yellow-500' },
  { icon: <TrendingUp className="w-4 h-4" />, text: '{name} reached {tier} tier!', color: 'text-primary' },
];

export const SocialProofBanner = () => {
  const [currentEvent, setCurrentEvent] = useState<SocialEvent | null>(null);
  const { isAuthenticated } = useAuth();

  const generateEvent = useCallback(async () => {
    try {
      // Fetch a recent active player
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, current_streak, tier')
        .gt('total_points', 0)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return;

      const player = data[Math.floor(Math.random() * data.length)];
      const name = player.display_name || player.username || 'Someone';
      const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

      const text = template.text
        .replace('{name}', name)
        .replace('{n}', String(player.current_streak || 3))
        .replace('{tier}', player.tier || 'Silver');

      setCurrentEvent({
        id: `${Date.now()}`,
        icon: template.icon,
        text,
        color: template.color,
      });

      // Auto-dismiss after 4s
      setTimeout(() => setCurrentEvent(null), 4000);
    } catch (e) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Show first event after 8 seconds
    const initial = setTimeout(generateEvent, 8000);
    // Then every 25-40 seconds
    const interval = setInterval(generateEvent, 25000 + Math.random() * 15000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isAuthenticated, generateEvent]);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed top-[calc(60px+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {currentEvent && (
          <motion.div
            key={currentEvent.id}
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card/90 backdrop-blur-lg border border-border/50 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 pointer-events-auto"
          >
            <span className={currentEvent.color}>
              {currentEvent.icon}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {currentEvent.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
