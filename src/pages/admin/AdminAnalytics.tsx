import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Database, 
  Trophy,
  TrendingUp,
  Swords,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getActualQuestionCounts, getAllSubjects, getTotalTargetQuestions } from '@/services/questionGenerator';

interface AnalyticsData {
  totalQuestions: number;
  totalUsers: number;
  totalBattles: number;
  totalQuizzes: number;
  questionsPerSubject: { name: string; count: number; target: number }[];
  recentUsers: { username: string; created_at: string }[];
  topPlayers: { username: string; total_points: number }[];
}

export const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get question counts
      const counts = await getActualQuestionCounts();
      const subjects = getAllSubjects();
      const questionsPerSubject = subjects.map(name => ({
        name,
        count: counts[name] || 0,
        target: getTotalTargetQuestions(name),
      }));

      const totalQuestions = questionsPerSubject.reduce((sum, s) => sum + s.count, 0);

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get battle count
      const { count: battleCount } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true });

      // Get quiz count
      const { count: quizCount } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true });

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get top players
      const { data: topPlayers } = await supabase
        .from('profiles')
        .select('username, total_points')
        .order('total_points', { ascending: false })
        .limit(10);

      setData({
        totalQuestions,
        totalUsers: userCount || 0,
        totalBattles: battleCount || 0,
        totalQuizzes: quizCount || 0,
        questionsPerSubject,
        recentUsers: recentUsers || [],
        topPlayers: topPlayers || [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Platform statistics and usage data
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalQuestions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                In database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Battles</CardTitle>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalBattles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                PvP battles played
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalQuizzes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Quiz sessions completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Questions per Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Subject</CardTitle>
            <CardDescription>Progress toward target counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.questionsPerSubject.map((subject) => {
                const percentage = Math.min(100, (subject.count / subject.target) * 100);
                return (
                  <div key={subject.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{subject.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {subject.count.toLocaleString()} / {subject.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percentage >= 100 ? 'bg-green-500' : 
                          percentage >= 50 ? 'bg-yellow-500' : 'bg-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Players
              </CardTitle>
              <CardDescription>By total points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topPlayers.map((player, index) => (
                  <div key={player.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.username || 'Anonymous'}</span>
                    </div>
                    <Badge variant="secondary">
                      {player.total_points?.toLocaleString() || 0} pts
                    </Badge>
                  </div>
                ))}
                {data.topPlayers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No players yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <CardDescription>Latest registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentUsers.map((user) => (
                  <div key={user.username} className="flex items-center justify-between">
                    <span className="font-medium">{user.username || 'Anonymous'}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
                {data.recentUsers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
