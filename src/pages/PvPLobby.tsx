import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createBattle, getOpenBattles, joinBattle, joinBattleByRoomCode, type Battle } from '@/services/battles';
import { getSubjects, type DbSubject } from '@/services/quiz';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords, Users, Clock, Trophy, ArrowLeft, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PvPModeSelector } from '@/components/pvp/PvPModeSelector';
import { PVP_MODES, type PvPModeType } from '@/types/quiz-modes';

type LobbyStep = 'mode-select' | 'subject-select' | 'create-join';

export function PvPLobby() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<DbSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [battleMode, setBattleMode] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [openBattles, setOpenBattles] = useState<Battle[]>([]);
  
  // New state for mode selection
  const [step, setStep] = useState<LobbyStep>('mode-select');
  const [selectedPvPMode, setSelectedPvPMode] = useState<PvPModeType | null>(null);
  const [rankedMatchesToday, setRankedMatchesToday] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectsData, battlesData] = await Promise.all([
        getSubjects(),
        getOpenBattles(10),
      ]);
      setSubjects(subjectsData);
      setOpenBattles(battlesData);
      if (subjectsData.length > 0) {
        setSelectedSubject(subjectsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const subjectSlugMap: Record<string, string> = {
    'Mathematics': 'mathematics',
    'Physics': 'physics',
    'Chemistry': 'chemistry',
    'Biology': 'biology',
    'English': 'english',
    'History': 'history',
    'Geography': 'geography',
    'Computer Science': 'computer-science',
  };

  const handleModeSelect = (mode: PvPModeType) => {
    setSelectedPvPMode(mode);
    const config = PVP_MODES[mode];
    
    if (config.allowSubjectSelection) {
      setStep('subject-select');
    } else {
      // For ranked/race, skip subject selection
      setStep('create-join');
    }
  };

  const handleSubjectNext = () => {
    setStep('create-join');
  };

  const handleBack = () => {
    if (step === 'create-join') {
      const config = selectedPvPMode ? PVP_MODES[selectedPvPMode] : null;
      if (config?.allowSubjectSelection) {
        setStep('subject-select');
      } else {
        setStep('mode-select');
        setSelectedPvPMode(null);
      }
    } else if (step === 'subject-select') {
      setStep('mode-select');
      setSelectedPvPMode(null);
    } else {
      navigate(-1);
    }
  };

  const handleCreateBattle = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }

    if (selectedPvPMode && PVP_MODES[selectedPvPMode].allowSubjectSelection && !selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    setIsLoading(true);
    try {
      let subjectSlug = 'mathematics';
      
      if (selectedSubject) {
        const subject = subjects.find(s => s.id === selectedSubject);
        subjectSlug = subject ? subjectSlugMap[subject.name] || 'mathematics' : 'mathematics';
      }
      
      const battle = await createBattle(user.id, subjectSlug as any, false);
      toast.success('Battle created! Waiting for opponent...');
      navigate(`/battle/${battle.id}`);
    } catch (error) {
      console.error('Failed to create battle:', error);
      toast.error('Failed to create battle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinBattle = async (battleId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await joinBattle(battleId, user.id);
      toast.success('Joined battle!');
      navigate(`/battle/${battleId}`);
    } catch (error) {
      console.error('Failed to join battle:', error);
      toast.error('Failed to join battle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim() || !user) {
      toast.error('Please enter a room code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinBattleByRoomCode(roomCode.toUpperCase(), user.id);
      
      if (result.success && result.battleId) {
        toast.success(result.message);
        navigate(`/battle/${result.battleId}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to join by code:', error);
      toast.error('Failed to join battle');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-4">Sign in to play PvP battles</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const modeConfig = selectedPvPMode ? PVP_MODES[selectedPvPMode] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Swords className="w-7 h-7 text-primary" />
              PvP Arena
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 'mode-select' && 'Choose your battle mode'}
              {step === 'subject-select' && `${modeConfig?.name} - Select subject`}
              {step === 'create-join' && `${modeConfig?.name} - Find opponent`}
            </p>
          </div>
        </div>

        {/* Step 1: Mode Selection */}
        {step === 'mode-select' && (
          <>
            <PvPModeSelector 
              onModeSelect={handleModeSelect}
              rankedMatchesToday={rankedMatchesToday}
            />
            
            {/* Info Card */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                XP vs Rank
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/20 text-success text-[10px]">
                    <Star className="w-2.5 h-2.5 mr-0.5" />XP
                  </Badge>
                  Casual & Race modes - practice without pressure
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 text-[10px]">
                    <Trophy className="w-2.5 h-2.5 mr-0.5" />Rank
                  </Badge>
                  Ranked Duel - affects your leaderboard position
                </p>
              </div>
            </Card>
          </>
        )}

        {/* Step 2: Subject Selection (for Casual Duel) */}
        {step === 'subject-select' && modeConfig && (
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Select Subject</h3>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      selectedSubject === subject.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{subject.icon}</span>
                    <span className="font-medium text-sm">{subject.name}</span>
                    <span className="text-xs text-muted-foreground block">
                      {subject.question_count} questions
                    </span>
                    {selectedSubject === subject.id && (
                      <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            <Button
              onClick={handleSubjectNext}
              disabled={!selectedSubject}
              className="w-full h-12 font-bold"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Create/Join Battle */}
        {step === 'create-join' && modeConfig && (
          <>
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setBattleMode('create')}
                className={cn(
                  "flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2",
                  battleMode === 'create'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trophy className="w-4 h-4" />
                Create Battle
              </button>
              <button
                onClick={() => setBattleMode('join')}
                className={cn(
                  "flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2",
                  battleMode === 'join'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-4 h-4" />
                Join Battle
              </button>
            </div>

            {battleMode === 'create' ? (
              <div className="space-y-6">
                {/* Battle Settings */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4">Battle Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Mode</span>
                      </div>
                      <span className="font-semibold text-sm">{modeConfig.name}</span>
                    </div>
                    {modeConfig.allowSubjectSelection && selectedSubject && (
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {subjects.find(s => s.id === selectedSubject)?.icon}
                          </span>
                          <span className="text-sm">Subject</span>
                        </div>
                        <span className="font-semibold text-sm">
                          {subjects.find(s => s.id === selectedSubject)?.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Time per Question</span>
                      </div>
                      <span className="font-semibold text-sm">{modeConfig.timePerQuestion}s</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Questions</span>
                      </div>
                      <span className="font-semibold text-sm">{modeConfig.questionCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {modeConfig.rewardType === 'rank' ? (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Star className="w-4 h-4 text-success" />
                        )}
                        <span className="text-sm">Reward</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px]",
                          modeConfig.rewardType === 'rank' 
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-success/20 text-success"
                        )}
                      >
                        {modeConfig.rewardType === 'rank' ? 'RANK' : 'XP'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Create Button */}
                <Button
                  onClick={handleCreateBattle}
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-bold"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Battle...
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5 mr-2" />
                      Create Battle
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Join by Code */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4">Enter Room Code</h3>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    placeholder="E.g., A1B2C3"
                    className="text-center text-xl font-mono tracking-widest h-14"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {roomCode.length}/6 characters
                  </p>
                  <Button
                    onClick={handleJoinByCode}
                    className="w-full mt-4"
                    disabled={roomCode.length < 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join by Code'
                    )}
                  </Button>
                </Card>

                {/* Open Battles */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4">Open Battles</h3>
                  {openBattles.length > 0 ? (
                    <div className="space-y-3">
                      {openBattles.map(battle => (
                        <div
                          key={battle.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {subjects.find(s => s.id === battle.subject_id)?.name || 'Quiz'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {battle.participants.length}/2 players
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleJoinBattle(battle.id)}
                            disabled={isLoading}
                          >
                            Join
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No open battles</p>
                      <p className="text-sm">Create one to get started!</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
