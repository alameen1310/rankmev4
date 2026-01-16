import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  generateQuestions,
  getActualQuestionCounts,
  SUBJECT_TOPICS,
  getTotalTargetQuestions,
  getAllSubjects,
  type GenerationProgress,
} from '@/services/questionGenerator';

interface SubjectStatus {
  name: string;
  current: number;
  target: number;
  isGenerating: boolean;
  progress?: GenerationProgress;
}

const AdminQuestions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGeneration, setActiveGeneration] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionCounts();
  }, []);

  const loadQuestionCounts = async () => {
    setIsLoading(true);
    try {
      const counts = await getActualQuestionCounts();
      const allSubjects = getAllSubjects();

      const subjectStatuses: SubjectStatus[] = allSubjects.map((name) => ({
        name,
        current: counts[name] || 0,
        target: getTotalTargetQuestions(name),
        isGenerating: false,
      }));

      setSubjects(subjectStatuses);
    } catch (error) {
      console.error('Error loading counts:', error);
      toast.error('Failed to load question counts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateForSubject = async (subjectName: string, topic?: string) => {
    if (activeGeneration) {
      toast.error('Please wait for current generation to complete');
      return;
    }

    setActiveGeneration(subjectName);
    setSubjects((prev) =>
      prev.map((s) => (s.name === subjectName ? { ...s, isGenerating: true } : s))
    );

    try {
      const topicToUse = topic || SUBJECT_TOPICS[subjectName]?.[0]?.name || 'General';
      toast.info(`Generating 15 ${subjectName} questions on ${topicToUse}...`);

      const result = await generateQuestions(subjectName, topicToUse, 15);

      if (result.success) {
        toast.success(`Generated ${result.inserted} ${subjectName} questions!`);
        await loadQuestionCounts();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate questions');
    } finally {
      setActiveGeneration(null);
      setSubjects((prev) =>
        prev.map((s) => (s.name === subjectName ? { ...s, isGenerating: false } : s))
      );
    }
  };

  const handleBulkGenerate = async (subjectName: string) => {
    if (activeGeneration) {
      toast.error('Please wait for current generation to complete');
      return;
    }

    setActiveGeneration(subjectName);
    const topics = SUBJECT_TOPICS[subjectName];
    
    if (!topics) {
      toast.error('Unknown subject');
      return;
    }

    let totalInserted = 0;

    for (const topic of topics) {
      const batches = Math.ceil(topic.targetCount / 15);

      for (let batch = 0; batch < batches; batch++) {
        const count = Math.min(15, topic.targetCount - batch * 15);

        setSubjects((prev) =>
          prev.map((s) =>
            s.name === subjectName
              ? {
                  ...s,
                  isGenerating: true,
                  progress: {
                    subject: subjectName,
                    topic: topic.name,
                    current: batch + 1,
                    total: batches,
                    inserted: totalInserted,
                    status: 'generating',
                  },
                }
              : s
          )
        );

        try {
          const result = await generateQuestions(subjectName, topic.name, count);
          if (result.success) {
            totalInserted += result.inserted;
          }
          // Delay between batches
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error in batch:`, error);
        }
      }
    }

    toast.success(`Bulk generation complete! Inserted ${totalInserted} questions.`);
    setActiveGeneration(null);
    await loadQuestionCounts();
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + s.current, 0);
  const totalTarget = subjects.reduce((sum, s) => sum + s.target, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to access admin features</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Question Database Manager</h1>
            <p className="text-sm text-muted-foreground">
              Generate JAMB-style questions using AI
            </p>
          </div>
          <Button variant="outline" onClick={loadQuestionCounts} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Total Questions
                </CardTitle>
                <CardDescription>
                  {totalQuestions.toLocaleString()} / {totalTarget.toLocaleString()} target
                </CardDescription>
              </div>
              <Badge variant={totalQuestions >= totalTarget ? 'default' : 'secondary'}>
                {Math.round((totalQuestions / totalTarget) * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(totalQuestions / totalTarget) * 100} className="h-3" />
          </CardContent>
        </Card>

        {/* Subject Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card
              key={subject.name}
              className={subject.isGenerating ? 'border-primary/50' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  {subject.current >= subject.target ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : subject.isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : null}
                </div>
                <CardDescription>
                  {subject.current.toLocaleString()} / {subject.target.toLocaleString()} questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  value={Math.min(100, (subject.current / subject.target) * 100)}
                  className="h-2"
                />

                {subject.progress && subject.isGenerating && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{subject.progress.topic}</p>
                    <p>
                      Batch {subject.progress.current}/{subject.progress.total}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateForSubject(subject.name)}
                    disabled={!!activeGeneration}
                    className="flex-1"
                  >
                    {subject.isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    +15 Questions
                  </Button>
                </div>

                {/* Topic buttons */}
                <div className="flex flex-wrap gap-1">
                  {SUBJECT_TOPICS[subject.name]?.slice(0, 4).map((topic) => (
                    <Button
                      key={topic.name}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleGenerateForSubject(subject.name, topic.name)}
                      disabled={!!activeGeneration}
                    >
                      {topic.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Generate Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Generate
            </CardTitle>
            <CardDescription>
              Generate questions for all subjects at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Button
                  key={subject.name}
                  variant="outline"
                  onClick={() => handleGenerateForSubject(subject.name)}
                  disabled={!!activeGeneration}
                >
                  {activeGeneration === subject.name && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  +15 {subject.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              1. Click "+15 Questions" to generate 15 JAMB-style questions for a subject
            </p>
            <p>
              2. Use topic buttons to generate questions for specific topics
            </p>
            <p>
              3. Questions are generated using AI and automatically saved to the database
            </p>
            <p>
              4. Keep generating until you reach your target of 1000+ questions per subject
            </p>
            <p className="text-yellow-600 dark:text-yellow-400">
              ⚠️ Note: Generation uses AI credits. Generate in batches to manage usage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminQuestions;
