import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Clock, Target, Medal, Crown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/TierBadge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Tier } from '@/types';
import { 
  getDailyLeaderboard, 
  getDailyChallengeHistory,
  type LeaderboardEntry,
  type HistoryEntry 
} from '@/services/dailyChallenge';

export function DailyChallengeLeaderboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'history'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeDate, setChallengeDate] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const historyData = await getDailyChallengeHistory();
        setHistory(historyData.history);
      } else {
        const data = await getDailyLeaderboard(activeTab === 'friends');
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
        setChallengeDate(data.challengeDate);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-warning" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-tier-silver" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-tier-bronze" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/30';
    if (rank === 2) return 'bg-gradient-to-r from-tier-silver/20 to-tier-silver/5 border-tier-silver/30';
    if (rank === 3) return 'bg-gradient-to-r from-tier-bronze/20 to-tier-bronze/5 border-tier-bronze/30';
    return 'bg-card';
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Daily Leaderboard
              </h1>
              <p className="text-xs text-muted-foreground">
                {challengeDate ? new Date(challengeDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="global" className="gap-1">
              <Trophy className="w-4 h-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-1">
              <Users className="w-4 h-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-3">
            {loading ? (
              <LeaderboardSkeleton />
            ) : leaderboard.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">No participants yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to complete today's challenge!
                </p>
              </Card>
            ) : (
              <>
                {/* User's Rank Card */}
                {userRank && (
                  <Card className="p-4 bg-primary/10 border-primary/30 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">#{userRank.rank}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Your Rank</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {userRank.score} • Accuracy: {Math.round(userRank.accuracy)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Leaderboard List */}
                {leaderboard.map((entry, index) => (
                  <Card 
                    key={entry.id} 
                    className={cn(
                      "p-4 border transition-all",
                      getRankBg(entry.rank),
                      entry.user_id === user?.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-10 text-center">
                        {getRankIcon(entry.rank) || (
                          <span className="text-lg font-bold text-muted-foreground">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {entry.profiles?.username?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {entry.profiles?.username || 'Unknown'}
                          </span>
                          {entry.profiles?.tier && (
                            <TierBadge tier={entry.profiles.tier as Tier} size="sm" />
                          )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {Math.round(entry.accuracy)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(entry.time_taken_seconds)}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.score}</p>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-3">
          {loading ? (
            <LeaderboardSkeleton />
          ) : leaderboard.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No friends have played yet</p>
              <p className="text-sm text-muted-foreground">
                Invite your friends to compete!
              </p>
            </Card>
          ) : (
            leaderboard.map((entry) => (
              <Card 
                key={entry.id} 
                className={cn(
                  "p-4 border transition-all",
                  getRankBg(entry.rank),
                  entry.user_id === user?.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center">
                    {getRankIcon(entry.rank) || (
                      <span className="text-lg font-bold text-muted-foreground">
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {entry.profiles?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">
                      {entry.profiles?.username || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{Math.round(entry.accuracy)}% accuracy</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{entry.score}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {loading ? (
            <LeaderboardSkeleton />
          ) : history.length === 0 ? (
            <Card className="p-8 text-center">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No history yet</p>
              <p className="text-sm text-muted-foreground">
                Complete your first daily challenge!
              </p>
            </Card>
          ) : (
            history.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {new Date(entry.daily_challenges?.challenge_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <Badge variant="outline">
                    #{entry.daily_leaderboards?.[0]?.rank || '-'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-warning" />
                    {entry.score} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-success" />
                    {Math.round(entry.accuracy)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(entry.time_taken_seconds)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
}

function LeaderboardSkeleton() {
return (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} className="p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
          <div className="h-6 bg-muted rounded w-12" />
        </div>
      </Card>
    ))}
  </div>
);
}