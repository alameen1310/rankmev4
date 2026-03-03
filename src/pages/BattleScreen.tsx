import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getBattle, 
  subscribeToBattle, 
  setParticipantReady, 
  submitBattleAnswer,
  completeBattle,
  type Battle,
} from '@/services/battles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Swords, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BattleVSScreen } from '@/components/pvp/BattleVSScreen';
import { BattleResultScreen } from '@/components/pvp/BattleResultScreen';
import { BattleScoreTicker } from '@/components/pvp/BattleScoreTicker';

interface BattleQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
}

export function BattleScreen() {
  const { battleId } = useParams<{ battleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [battle, setBattle] = useState<Battle | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);
  const [showVSScreen, setShowVSScreen] = useState(false);

  // Load battle data
  useEffect(() => {
    if (!battleId) return;
    
    const loadBattle = async () => {
      try {
        const battleData = await getBattle(battleId);
        setBattle(battleData);
        
        const participant = battleData?.participants.find(p => p.user_id === user?.id);
        setIsReady(participant?.ready || false);
        
        if (battleData?.status === 'active') {
          // Show VS screen when battle becomes active
          if (!showVSScreen && !battleComplete) {
            setShowVSScreen(true);
          }
          await loadQuestions();
        }
      } catch (error) {
        console.error('Error loading battle:', error);
        toast.error('Failed to load battle');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBattle();
    
    const channel = subscribeToBattle(
      battleId,
      async (updatedBattle) => {
        setBattle(updatedBattle);
        if (updatedBattle.status === 'active' && questions.length === 0) {
          setShowVSScreen(true);
          await loadQuestions();
        }
        if (updatedBattle.status === 'completed') {
          setBattleComplete(true);
        }
      },
      async () => {
        const updatedBattle = await getBattle(battleId);
        if (updatedBattle) {
          setBattle(updatedBattle);
        }
      }
    );
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user?.id]);

  const loadQuestions = async () => {
    if (!battleId) return;
    
    const { data, error } = await supabase
      .from('battle_questions')
      .select(`
        question_id,
        order_index,
        questions (
          id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty
        )
      `)
      .eq('battle_id', battleId)
      .order('order_index');
    
    if (data && data.length > 0) {
      const formattedQuestions = data
        .map(bq => bq.questions as unknown as BattleQuestion)
        .filter(Boolean);
      setQuestions(formattedQuestions);
    } else {
      setQuestions([
        { id: 1, question_text: 'What is 2 + 2?', option_a: '3', option_b: '4', option_c: '5', option_d: '6', correct_answer: 'B', difficulty: 'easy' },
        { id: 2, question_text: 'What is the capital of France?', option_a: 'London', option_b: 'Berlin', option_c: 'Paris', option_d: 'Madrid', correct_answer: 'C', difficulty: 'easy' },
        { id: 3, question_text: 'What is H₂O?', option_a: 'Hydrogen', option_b: 'Oxygen', option_c: 'Water', option_d: 'Carbon', correct_answer: 'C', difficulty: 'easy' },
        { id: 4, question_text: 'What is 10 × 5?', option_a: '40', option_b: '50', option_c: '60', option_d: '55', correct_answer: 'B', difficulty: 'easy' },
        { id: 5, question_text: 'What is the largest planet?', option_a: 'Earth', option_b: 'Mars', option_c: 'Jupiter', option_d: 'Saturn', correct_answer: 'C', difficulty: 'medium' },
      ]);
    }
  };

  // Timer
  useEffect(() => {
    if (battle?.status !== 'active' || showResult || battleComplete || showVSScreen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [battle?.status, showResult, currentQuestionIndex, battleComplete, showVSScreen]);

  const handleReady = async () => {
    if (!battleId || !user) return;
    try {
      await setParticipantReady(battleId, user.id);
      setIsReady(true);
      toast.success('You are ready!');
    } catch (error) {
      toast.error('Failed to set ready status');
    }
  };

  const handleAnswer = useCallback(async (answer: string) => {
    if (selectedAnswer || !battleId || !user || battleComplete) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const timeSpent = (20 - timeLeft) * 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion?.correct_answer;
    const points = isCorrect ? Math.max(100, 150 - Math.floor(timeSpent / 100)) : 0;
    
    try {
      await submitBattleAnswer(battleId, user.id, isCorrect, points);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
    
    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(20);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        try {
          await completeBattle(battleId);
          setBattleComplete(true);
        } catch (error) {
          console.error('Error completing battle:', error);
        }
      }
    }, 1400);
  }, [selectedAnswer, battleId, user, timeLeft, questions, currentQuestionIndex, battleComplete]);

  const copyRoomCode = () => {
    const code = battle?.room_code || battleId || '';
    navigator.clipboard.writeText(code);
    toast.success('Room code copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Battle Not Found</h2>
          <p className="text-muted-foreground mb-4">This battle doesn't exist or has ended.</p>
          <Button onClick={() => navigate('/pvp')}>Back to Lobby</Button>
        </Card>
      </div>
    );
  }

  // VS Screen overlay
  if (showVSScreen && battle.participants.length >= 2) {
    return (
      <BattleVSScreen
        player1={battle.participants[0]}
        player2={battle.participants[1]}
        onComplete={() => setShowVSScreen(false)}
      />
    );
  }

  // Waiting Room
  if (battle.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <Card className="p-6 text-center">
            <Swords className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold mb-2">Waiting for Opponent</h1>
            <p className="text-muted-foreground mb-6">
              Share the room code to start!
            </p>
            
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">Room Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-widest">
                  {battle.room_code || battleId?.slice(0, 6).toUpperCase()}
                </code>
                <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold">Players ({battle.participants.length}/2)</h3>
              {battle.participants.map(participant => (
                <div
                  key={participant.user_id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={participant.avatar_url || undefined} />
                      <AvatarFallback>
                        {participant.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">
                        {participant.display_name || participant.username || 'Player'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.ready ? '✅ Ready' : '⏳ Waiting'}
                      </p>
                    </div>
                  </div>
                  {participant.user_id === user?.id && !isReady && (
                    <Button size="sm" onClick={handleReady}>
                      Ready Up
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button variant="outline" onClick={() => navigate('/pvp')}>
              Leave Battle
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Battle Complete - use new result screen
  if (battleComplete || battle.status === 'completed') {
    return (
      <BattleResultScreen
        participants={battle.participants}
        winnerId={battle.winner_id}
        currentUserId={user?.id || ''}
        totalQuestions={questions.length}
        onNewBattle={() => navigate('/pvp')}
        onLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }

  // Active Battle
  const currentQuestion = questions[currentQuestionIndex];
  const options = currentQuestion ? [
    { label: 'A', value: 'A', text: currentQuestion.option_a },
    { label: 'B', value: 'B', text: currentQuestion.option_b },
    { label: 'C', value: 'C', text: currentQuestion.option_c },
    { label: 'D', value: 'D', text: currentQuestion.option_d },
  ] : [];

  const p1 = battle.participants[0];
  const p2 = battle.participants[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-8">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Real-time Score Ticker */}
        {p1 && p2 && (
          <BattleScoreTicker
            player1={p1}
            player2={p2}
            currentUserId={user?.id || ''}
          />
        )}

        {/* Timer & Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                Q{currentQuestionIndex + 1}/{questions.length}
              </span>
              <span className="font-semibold text-primary">+100 pts</span>
            </div>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
          </div>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold",
            timeLeft <= 5 ? "bg-destructive/15 text-destructive animate-pulse" : "bg-primary/15 text-primary"
          )}>
            {timeLeft}
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <Card className="p-5 animate-fade-in">
            <span className={cn(
              "inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3 uppercase",
              currentQuestion.difficulty === 'easy' && "bg-success/15 text-success",
              currentQuestion.difficulty === 'medium' && "bg-warning/15 text-warning",
              currentQuestion.difficulty === 'hard' && "bg-destructive/15 text-destructive"
            )}>
              {currentQuestion.difficulty}
            </span>
            <h2 className="text-lg font-bold leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </Card>
        )}

        {/* Options */}
        <div className="grid gap-2.5">
          {options.map(option => {
            const isCorrect = option.value === currentQuestion?.correct_answer;
            const isSelected = selectedAnswer === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                disabled={showResult}
                className={cn(
                  "p-4 rounded-xl text-left transition-all duration-200 w-full active:scale-[0.98]",
                  !showResult && "bg-card border border-border/50 hover:bg-primary/10 hover:border-primary/30",
                  showResult && isCorrect && "bg-success/15 border-2 border-success",
                  showResult && isSelected && !isCorrect && "bg-destructive/15 border-2 border-destructive animate-[shake_0.3s_ease-in-out]",
                  showResult && !isSelected && !isCorrect && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                    showResult && isCorrect && "bg-success text-white",
                    showResult && isSelected && !isCorrect && "bg-destructive text-white",
                    !showResult && "bg-muted"
                  )}>
                    {option.label}
                  </span>
                  <span className="font-medium text-sm flex-1">{option.text}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
