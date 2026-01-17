import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Users, 
  Sparkles, 
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Swords
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getActualQuestionCounts, SUBJECT_TOPICS, getTotalTargetQuestions, getAllSubjects } from '@/services/questionGenerator';

interface DashboardStats {
  totalQuestions: number;
  totalUsers: number;
  totalBattles: number;
  totalQuizzes: number;
  recentActivity: { type: string; message: string; time: string }[];
}

interface SubjectProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    totalUsers: 0,
    totalBattles: 0,
    totalQuizzes: 0,
    recentActivity: [],
  });
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load question counts per subject
      const counts = await getActualQuestionCounts();
      const subjects = getAllSubjects();
      
      const progress: SubjectProgress[] = subjects.map(name => {
        const current = counts[name] || 0;
        const target = getTotalTargetQuestions(name);
        return {
          name,
          current,
          target,
          percentage: Math.min(100, (current / target) * 100),
        };
      });
      setSubjectProgress(progress);

      // Get total questions
      const totalQuestions = progress.reduce((sum, s) => sum + s.current, 0);

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get battle count
      const { count: battleCount } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true });

      // Get quiz session count
      const { count: quizCount } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalQuestions,
        totalUsers: userCount || 0,
        totalBattles: battleCount || 0,
        totalQuizzes: quizCount || 0,
        recentActivity: [
          { type: 'question', message: 'Questions database initialized', time: 'Today' },
          { type: 'user', message: 'Admin system activated', time: 'Today' },
        ],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalTarget = subjectProgress.reduce((sum, s) => sum + s.target, 0);
  const overallProgress = totalTarget > 0 ? (stats.totalQuestions / totalTarget) * 100 : 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Papi! Here's your question database overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Target: {totalTarget.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PvP Battles</CardTitle>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBattles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Battles played</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Sessions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Quizzes completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Question Database Progress
                </CardTitle>
                <CardDescription>
                  {stats.totalQuestions.toLocaleString()} / {totalTarget.toLocaleString()} questions generated
                </CardDescription>
              </div>
              <Badge variant={overallProgress >= 100 ? 'default' : 'secondary'}>
                {Math.round(overallProgress)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-4" />
          </CardContent>
        </Card>

        {/* Subject Progress Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjectProgress.map((subject) => (
            <Card key={subject.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  {subject.percentage >= 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : subject.percentage >= 50 ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <CardDescription>
                  {subject.current.toLocaleString()} / {subject.target.toLocaleString()} questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={subject.percentage} className="h-2 mb-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{Math.round(subject.percentage)}% complete</span>
                  <span className="text-muted-foreground">
                    {(subject.target - subject.current).toLocaleString()} remaining
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Users className="h-5 w-5 mr-3 text-indigo-500" />
                  <div className="text-left">
                    <div className="font-medium">Users</div>
                    <div className="text-xs text-muted-foreground">Manage all users</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link to="/admin/questions">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Sparkles className="h-5 w-5 mr-3 text-purple-500" />
                  <div className="text-left">
                    <div className="font-medium">AI Generator</div>
                    <div className="text-xs text-muted-foreground">Generate questions with AI</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link to="/admin/add-question">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Database className="h-5 w-5 mr-3 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Add Question</div>
                    <div className="text-xs text-muted-foreground">Manually add a question</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link to="/admin/manage">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Database className="h-5 w-5 mr-3 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Manage</div>
                    <div className="text-xs text-muted-foreground">View & edit questions</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link to="/admin/analytics">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <TrendingUp className="h-5 w-5 mr-3 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-muted-foreground">View usage statistics</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. <strong>AI Generator:</strong> Use AI to generate 15 JAMB-style questions at a time</p>
            <p>2. <strong>Add Question:</strong> Manually add questions with images for math diagrams</p>
            <p>3. <strong>Manage:</strong> Review, edit, or delete existing questions</p>
            <p>4. <strong>Target:</strong> Aim for 1000+ questions per subject for a comprehensive database</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
