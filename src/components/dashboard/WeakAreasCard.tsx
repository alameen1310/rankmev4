import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WeakArea {
  subject: string;
  accuracy: number;
  totalAttempted: number;
}

export function WeakAreasCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);

  useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('subject_name, accuracy, total_questions')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return;

      // Aggregate by subject
      const subjectMap = new Map<string, { total: number; correct: number; count: number }>();
      
      data.forEach(session => {
        const name = session.subject_name || 'Unknown';
        const existing = subjectMap.get(name) || { total: 0, correct: 0, count: 0 };
        existing.total += session.total_questions || 0;
        existing.correct += Math.round(((session.accuracy || 0) / 100) * (session.total_questions || 0));
        existing.count += 1;
        subjectMap.set(name, existing);
      });

      const areas: WeakArea[] = [];
      subjectMap.forEach((stats, subject) => {
        if (stats.total >= 5) {
          const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
          if (accuracy < 70) {
            areas.push({ subject, accuracy, totalAttempted: stats.total });
          }
        }
      });

      areas.sort((a, b) => a.accuracy - b.accuracy);
      setWeakAreas(areas.slice(0, 3));
    })();
  }, [user]);

  if (weakAreas.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-sm">Weak Areas</h3>
      </div>

      <div className="space-y-3">
        {weakAreas.map(area => (
          <div key={area.subject} className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{area.subject}</span>
                <span className={cn(
                  "text-xs font-bold",
                  area.accuracy < 40 ? "text-destructive" : "text-warning"
                )}>
                  {Math.round(area.accuracy)}%
                </span>
              </div>
              <Progress value={area.accuracy} className="h-1.5" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary px-2 h-7 shrink-0"
              onClick={() => navigate('/quiz')}
            >
              Fix <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}