import { useState } from 'react';
import { Clock, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardData, subjects } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { LeaderboardTab } from '@/types';

const tabs: { id: LeaderboardTab; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
  { id: 'friends', label: 'Friends' },
  { id: 'subjects', label: 'Subjects' },
];

export const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);

  // Reset countdown timer (placeholder)
  const resetTime = '6d 12h 34m';

  // Get data based on active tab
  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'country':
        return leaderboardData.filter(e => e.country === user?.country);
      case 'friends':
        return leaderboardData.slice(0, 10); // Mock friends
      case 'subjects':
        return leaderboardData.slice(0, 30);
      default:
        return leaderboardData;
    }
  };

  const data = getLeaderboardData();

  // Find user's position
  const userEntry = data.find(e => e.rank === user?.rank);
  const userPosition = data.findIndex(e => e.rank === user?.rank);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass sticky top-14 z-40 border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">🏆 Leaderboard</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span>Resets in {resetTime}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subject filter for subjects tab */}
          {activeTab === 'subjects' && (
            <div className="mt-3 relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowSubjectFilter(!showSubjectFilter)}
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedSubject 
                    ? subjects.find(s => s.id === selectedSubject)?.name 
                    : 'All Subjects'
                  }
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showSubjectFilter && "rotate-180"
                )} />
              </Button>

              {showSubjectFilter && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 glass rounded-xl z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setSelectedSubject(null);
                      setShowSubjectFilter(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      !selectedSubject ? "bg-primary/10 text-primary" : "hover:bg-accent"
                    )}
                  >
                    All Subjects
                  </button>
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject.id);
                        setShowSubjectFilter(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                        selectedSubject === subject.id 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-accent"
                      )}
                    >
                      <span>{subject.icon}</span>
                      {subject.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="container max-w-lg mx-auto px-4 py-4">
        {/* Top 3 Podium */}
        {activeTab === 'global' && (
          <div className="flex items-end justify-center gap-2 mb-6 py-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl">🥈</span>
              </div>
              <span className="font-semibold text-sm truncate max-w-[80px]">
                {data[1]?.username.split(' ')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {data[1]?.points.toLocaleString()}
              </span>
              <div className="w-20 h-16 bg-gradient-to-t from-gray-400/50 to-gray-300/30 rounded-t-lg mt-2" />
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-2 shadow-gold-glow">
                  <span className="text-3xl">🥇</span>
                </div>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">👑</span>
              </div>
              <span className="font-bold truncate max-w-[80px]">
                {data[0]?.username.split(' ')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {data[0]?.points.toLocaleString()}
              </span>
              <div className="w-24 h-24 bg-gradient-to-t from-yellow-500/50 to-yellow-400/30 rounded-t-lg mt-2" />
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl">🥉</span>
              </div>
              <span className="font-semibold text-sm truncate max-w-[80px]">
                {data[2]?.username.split(' ')[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {data[2]?.points.toLocaleString()}
              </span>
              <div className="w-20 h-12 bg-gradient-to-t from-amber-700/50 to-amber-600/30 rounded-t-lg mt-2" />
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {data.slice(activeTab === 'global' ? 3 : 0).map((entry, index) => (
            <div
              key={entry.id}
              className="animate-fade-in"
              style={{ animationDelay: `${(index % 10) * 50}ms` }}
            >
              <LeaderboardRow
                entry={entry}
                isCurrentUser={entry.rank === user?.rank}
              />
            </div>
          ))}
        </div>

        {/* User's Position (sticky at bottom if not visible) */}
        {user && userEntry && userPosition > 10 && (
          <div className="fixed bottom-20 left-4 right-4 z-40">
            <div className="container max-w-lg mx-auto">
              <div className="glass rounded-xl border-2 border-primary/30 shadow-glow">
                <LeaderboardRow entry={userEntry} isCurrentUser />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
