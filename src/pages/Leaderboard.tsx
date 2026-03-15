import { useState, useMemo, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { LeaderboardSkeleton } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getGlobalLeaderboard, getUserRank } from '@/services/leaderboard';
import { cn } from '@/lib/utils';
import type { LeaderboardTab, LeaderboardEntry } from '@/types';

const tabs: { id: LeaderboardTab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
  { id: 'friends', label: 'Friends' },
];

export const Leaderboard = () => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getGlobalLeaderboard(100);
        setLeaderboardData(data);
        if (user) {
          const rank = await getUserRank(user.id);
          setUserRank(rank?.rank || null);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const filteredData = useMemo(() => {
    let data = [...leaderboardData];

    switch (activeTab) {
      case 'country':
        data = data.filter(e => e.country === (profile?.country || 'US'));
        break;
      case 'friends':
        data = data.slice(0, 15);
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(e =>
        e.username.toLowerCase().includes(query) ||
        e.country.toLowerCase().includes(query)
      );
    }

    return data;
  }, [activeTab, searchQuery, profile?.country, leaderboardData]);

  const userEntry = userRank ? leaderboardData.find(e => e.rank === userRank) : null;
  const userInView = userRank ? filteredData.some(e => e.rank === userRank) : false;

  // Show podium only for global with enough entries and no search
  const showPodium = activeTab === 'global' && !searchQuery && filteredData.length >= 3;
  const listStartIndex = showPodium ? 3 : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getGlobalLeaderboard(100);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setIsRefreshing(false);
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-background sticky top-14 z-40 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Leaderboard</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground flex items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>

          <SearchBar placeholder="Search players..." onSearch={setSearchQuery} />

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setVisibleCount(20); }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Podium — clean */}
        {showPodium && (
          <div className="flex items-end justify-center gap-3 mb-6 pt-2">
            {/* 2nd */}
            <div className="flex flex-col items-center w-20">
              <span className="text-2xl mb-1">🥈</span>
              <span className="font-semibold text-xs truncate w-full text-center">
                {filteredData[1]?.username.split(' ')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {filteredData[1]?.points.toLocaleString()}
              </span>
              <div className="w-full h-12 bg-secondary rounded-t-lg mt-2" />
            </div>

            {/* 1st */}
            <div className="flex flex-col items-center w-24">
              <span className="text-3xl mb-1">🥇</span>
              <span className="font-bold text-sm truncate w-full text-center">
                {filteredData[0]?.username.split(' ')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {filteredData[0]?.points.toLocaleString()}
              </span>
              <div className="w-full h-16 bg-primary/15 rounded-t-lg mt-2" />
            </div>

            {/* 3rd */}
            <div className="flex flex-col items-center w-20">
              <span className="text-2xl mb-1">🥉</span>
              <span className="font-semibold text-xs truncate w-full text-center">
                {filteredData[2]?.username.split(' ')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {filteredData[2]?.points.toLocaleString()}
              </span>
              <div className="w-full h-8 bg-secondary rounded-t-lg mt-2" />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {filteredData.length} player{filteredData.length !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-primary font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : (
          <div className="space-y-1.5">
            {filteredData.slice(listStartIndex, visibleCount).map((entry) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                isCurrentUser={entry.id === user?.id}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredData.length && (
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + 20, filteredData.length))}
            className="w-full py-3 mt-3 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors"
          >
            Load more ({filteredData.length - visibleCount} remaining)
          </button>
        )}

        {/* Empty state */}
        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="font-semibold mb-1">No players yet</h3>
            <p className="text-sm text-muted-foreground">Complete quizzes to appear here!</p>
          </div>
        )}
      </div>

      {/* Sticky user card */}
      {user && userEntry && !userInView && (
        <div className="fixed bottom-16 left-4 right-4 z-40 lg:left-60" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-xl shadow-lg border border-primary/20">
              <LeaderboardRow entry={userEntry} isCurrentUser />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
