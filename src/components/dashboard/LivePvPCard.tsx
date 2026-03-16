import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const LivePvPCard = () => {
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');
      setWaitingCount(count || 0);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Swords className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold">Live PvP</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {waitingCount} player{waitingCount !== 1 ? 's' : ''} waiting
            </p>
          </div>
        </div>
        <Link to="/pvp">
          <Button size="sm" variant="outline" className="h-8 text-xs game-tap">
            Join Match
          </Button>
        </Link>
      </div>
    </div>
  );
};
