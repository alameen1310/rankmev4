import { useState } from 'react';
import { Trophy, Target, Crown, Gift, Flame, Star, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierProgress } from '@/components/gamification/TierProgress';
import { BadgeCollection } from '@/components/gamification/BadgeCollection';
import { TitleSelector } from '@/components/gamification/TitleSelector';
import { DailyRewards } from '@/components/gamification/DailyRewards';
import { ChallengeTracker } from '@/components/gamification/ChallengeTracker';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const Gamification = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { 
      label: 'Total Points', 
      value: profile?.total_points?.toLocaleString() || '0', 
      icon: Star, 
      color: 'text-warning' 
    },
    { 
      label: 'Current Streak', 
      value: `${profile?.current_streak || 0} days`, 
      icon: Flame, 
      color: 'text-orange-500' 
    },
    { 
      label: 'Quizzes Done', 
      value: profile?.total_quizzes_completed?.toLocaleString() || '0', 
      icon: Trophy, 
      color: 'text-primary' 
    },
    { 
      label: 'Accuracy', 
      value: `${Math.round(profile?.accuracy || 0)}%`, 
      icon: Target, 
      color: 'text-success' 
    },
  ];

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold">Achievements & Rewards</h1>
        <p className="text-sm text-muted-foreground">
          Track your progress, earn badges, and climb the ranks!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div 
            key={stat.label}
            className="glass rounded-xl p-3 text-center"
          >
            <stat.icon className={cn("h-5 w-5 mx-auto mb-1", stat.color)} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="overview" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
          >
            <Star className="h-4 w-4" />
            <span className="text-[10px]">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="badges" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
          >
            <Trophy className="h-4 w-4" />
            <span className="text-[10px]">Badges</span>
          </TabsTrigger>
          <TabsTrigger 
            value="challenges" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
          >
            <Target className="h-4 w-4" />
            <span className="text-[10px]">Challenges</span>
          </TabsTrigger>
          <TabsTrigger 
            value="titles" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
          >
            <Crown className="h-4 w-4" />
            <span className="text-[10px]">Titles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
          >
            <Gift className="h-4 w-4" />
            <span className="text-[10px]">Rewards</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <TierProgress points={profile?.total_points || 0} />
          <TitleSelector />
          <BadgeCollection compact />
          <DailyRewards />
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          <BadgeCollection showShowcase />
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-4">
          <ChallengeTracker />
        </TabsContent>

        {/* Titles Tab */}
        <TabsContent value="titles" className="mt-4 space-y-4">
          <TitleSelector />
          <TierProgress points={profile?.total_points || 0} showBenefits />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-4">
          <DailyRewards />
        </TabsContent>
      </Tabs>
    </div>
  );
};
