import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Database,
  Filter,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBJECT_TOPICS } from '@/services/questionGenerator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  difficulty: string | null;
  points_value: number | null;
  created_at: string | null;
  subjects: { name: string } | null;
}

const PAGE_SIZE = 20;

export const ManageQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const subjects = Object.keys(SUBJECT_TOPICS);

  useEffect(() => {
    loadQuestions();
  }, [currentPage, filterSubject, filterDifficulty]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*, subjects(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (filterSubject !== 'all') {
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id')
          .eq('name', filterSubject)
          .single();
        
        if (subjectData) {
          query = query.eq('subject_id', subjectData.id);
        }
      }

      if (filterDifficulty !== 'all') {
        query = query.eq('difficulty', filterDifficulty);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Error loading questions:', error);
        toast.error('Failed to load questions');
        return;
      }

      setQuestions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadQuestions();
      return;
    }

    setIsLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('questions')
        .select('*, subjects(name)', { count: 'exact' })
        .ilike('question_text', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        console.error('Search error:', error);
        toast.error('Search failed');
        return;
      }

      setQuestions(data || []);
      setTotalCount(count || 0);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionToDelete);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete question');
        return;
      }

      toast.success('Question deleted');
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      loadQuestions();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getDifficultyBadge = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Easy</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</Badge>;
      case 'hard':
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Hard</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Manage Questions
          </h1>
          <p className="text-muted-foreground">
            View, search, and manage all questions in the database
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {questions.length} of {totalCount.toLocaleString()} questions</span>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>

        {/* Questions List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions found</p>
              </div>
            ) : (
              <div className="divide-y">
                {questions.map((question) => (
                  <div 
                    key={question.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {question.subjects?.name || 'Unknown'}
                          </Badge>
                          {getDifficultyBadge(question.difficulty)}
                          <span className="text-xs text-muted-foreground">
                            #{question.id}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">
                          {question.question_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Answer: {question.correct_answer} | Points: {question.points_value || 10}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedQuestion(question);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setQuestionToDelete(question.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* View Question Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Question Details</DialogTitle>
              <DialogDescription>
                Question #{selectedQuestion?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge>{selectedQuestion.subjects?.name}</Badge>
                  {getDifficultyBadge(selectedQuestion.difficulty)}
                  <Badge variant="outline">{selectedQuestion.points_value} pts</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Question:</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {selectedQuestion.question_text}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Options:</h4>
                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                      const isCorrect = selectedQuestion.correct_answer === letter;
                      const optionKey = `option_${letter.toLowerCase()}` as keyof Question;
                      return (
                        <div
                          key={letter}
                          className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                            isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCorrect ? 'bg-green-500 text-white' : 'bg-muted-foreground/20'
                          }`}>
                            {letter}
                          </span>
                          <span>{selectedQuestion[optionKey] as string}</span>
                          {isCorrect && <Badge className="ml-auto" variant="default">Correct</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedQuestion.explanation && (
                  <div>
                    <h4 className="font-medium mb-2">Explanation:</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the question from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ManageQuestions;
