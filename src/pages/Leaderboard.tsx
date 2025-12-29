import { useState, useMemo, useEffect } from 'react';
import { Clock, Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { FilterChips } from '@/components/FilterChips';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { LeaderboardSkeleton } from '@/components/Skeleton';
import { BottomSheet } from '@/components/BottomSheet';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardData, subjects } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { LeaderboardTab, Tier } from '@/types';

const tabs: { id: LeaderboardTab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
  { id: 'friends', label: 'Friends' },
  { id: 'subjects', label: 'Subjects' },
];

const tierFilters = [
  { id: 'all', label: 'All Tiers' },
  { id: 'champion', label: 'Champion', icon: '👑' },
  { id: 'diamond', label: 'Diamond', icon: '💎' },
  { id: 'platinum', label: 'Platinum', icon: '🏆' },
  { id: 'gold', label: 'Gold', icon: '🥇' },
  { id: 'silver', label: 'Silver', icon: '🥈' },
  { id: 'bronze', label: 'Bronze', icon: '🥉' },
];

export const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const resetTime = '6d 12h 34m';

  // Filter data based on tab, search, and tier
  const filteredData = useMemo(() => {
    let data = [...leaderboardData];

    // Filter by tab
    switch (activeTab) {
      case 'country':
        data = data.filter(e => e.country === user?.country);
        break;
      case 'friends':
        data = data.slice(0, 15);
        break;
      case 'subjects':
        data = data.slice(0, 30);
        break;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(e => 
        e.username.toLowerCase().includes(query) ||
        e.country.toLowerCase().includes(query)
      );
    }

    // Filter by tier
    if (selectedTiers.length > 0 && !selectedTiers.includes('all')) {
      data = data.filter(e => selectedTiers.includes(e.tier));
    }

    return data;
  }, [activeTab, searchQuery, selectedTiers, user?.country]);

  const userEntry = leaderboardData.find(e => e.rank === user?.rank);
  const userInView = filteredData.some(e => e.rank === user?.rank);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Leaderboard
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/80 px-2.5 py-1.5 rounded-full">
              <Clock className="h-3 w-3" />
              <span>Resets {resetTime}</span>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search players..."
            onSearch={setSearchQuery}
            showFilters
            onFilterClick={() => setShowFilters(true)}
          />

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setVisibleCount(20);
                }}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all min-w-[70px] touch-target",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tier Filters */}
          <FilterChips
            options={tierFilters}
            selected={selectedTiers}
            onChange={setSelectedTiers}
          />
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Top 3 Podium - Only for global tab */}
        {activeTab === 'global' && !searchQuery && selectedTiers.length === 0 && (
          <div className="flex items-end justify-center gap-2 mb-6 pt-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-xl">🥈</span>
              </div>
              <span className="font-semibold text-xs truncate max-w-[70px] text-center">
                {filteredData[1]?.username.split(' ')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {filteredData[1]?.points.toLocaleString()}
              </span>
              <div className="w-16 h-14 bg-gradient-to-t from-gray-400/40 to-gray-300/20 rounded-t-lg mt-2" />
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center animate-fade-in">
              <div className="relative">
                <div className="w-18 h-18 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-2 shadow-gold-glow p-4">
                  <span className="text-2xl">🥇</span>
                </div>
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-xl">👑</span>
              </div>
              <span className="font-bold text-sm truncate max-w-[80px] text-center">
                {filteredData[0]?.username.split(' ')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {filteredData[0]?.points.toLocaleString()}
              </span>
              <div className="w-20 h-20 bg-gradient-to-t from-yellow-500/40 to-yellow-400/20 rounded-t-lg mt-2" />
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-xl">🥉</span>
              </div>
              <span className="font-semibold text-xs truncate max-w-[70px] text-center">
                {filteredData[2]?.username.split(' ')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {filteredData[2]?.points.toLocaleString()}
              </span>
              <div className="w-16 h-10 bg-gradient-to-t from-amber-700/40 to-amber-600/20 rounded-t-lg mt-2" />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            {filteredData.length} players
          </span>
          <div className="flex items-center gap-2">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-primary font-medium"
              >
                Clear search
              </button>
            )}
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground flex items-center gap-1 touch-target"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* List with loading state */}
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : (
          <div className="space-y-2">
            {filteredData
              .slice(activeTab === 'global' && !searchQuery && selectedTiers.length === 0 ? 3 : 0, visibleCount)
              .map((entry, index) => (
                <div
                  key={entry.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index % 10) * 30}ms` }}
                >
                  <LeaderboardRow
                    entry={entry}
                    isCurrentUser={entry.rank === user?.rank}
                  />
                </div>
              ))}
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredData.length && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 mt-4 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors touch-target"
          >
            Load more ({filteredData.length - visibleCount} remaining)
          </button>
        )}

        {/* Empty state */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players found</p>
          </div>
        )}
      </div>

      {/* Sticky User Position Card */}
      {user && userEntry && !userInView && (
        <div className="fixed bottom-20 left-4 right-4 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-lg mx-auto">
            <div className="glass-strong rounded-xl shadow-lg border border-primary/20">
              <LeaderboardRow entry={userEntry} isCurrentUser />
            </div>
          </div>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Leaderboard"
      >
        <div className="space-y-6">
          {/* Subject Filter (for subjects tab) */}
          {activeTab === 'subjects' && (
            <div>
              <h3 className="font-semibold mb-3">Subject</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all touch-target",
                    !selectedSubject 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  All Subjects
                </button>
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all flex items-center gap-2 touch-target",
                      selectedSubject === subject.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-accent"
                    )}
                  >
                    <span>{subject.icon}</span>
                    <span className="text-sm font-medium truncate">{subject.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tier Filter */}
          <div>
            <h3 className="font-semibold mb-3">Tier</h3>
            <div className="space-y-2">
              {tierFilters.slice(1).map(tier => (
                <button
                  key={tier.id}
                  onClick={() => {
                    if (selectedTiers.includes(tier.id)) {
                      setSelectedTiers(selectedTiers.filter(t => t !== tier.id));
                    } else {
                      setSelectedTiers([...selectedTiers, tier.id]);
                    }
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 touch-target",
                    selectedTiers.includes(tier.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  <span className="text-lg">{tier.icon}</span>
                  <span className="font-medium">{tier.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => setShowFilters(false)}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl touch-target"
          >
            Apply Filters
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};