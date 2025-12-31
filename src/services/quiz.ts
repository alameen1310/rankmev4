import { supabase } from '@/integrations/supabase/client';
import type { Question, Subject } from '@/types';

export interface DbQuestion {
  id: number;
  subject_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  points_value: number;
  explanation: string | null;
}

export interface DbSubject {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  question_count: number;
  description: string | null;
}

// Map subject slug to name for compatibility
const subjectSlugMap: Record<Subject, string> = {
  'mathematics': 'Mathematics',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'english': 'English',
  'history': 'History',
  'geography': 'Geography',
  'computer-science': 'Computer Science',
};

// Convert DB question to frontend Question type
function convertDbQuestion(dbQ: DbQuestion, subjectSlug: Subject): Question {
  const options = [dbQ.option_a, dbQ.option_b, dbQ.option_c, dbQ.option_d];
  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(dbQ.correct_answer.toUpperCase());
  
  return {
    id: String(dbQ.id),
    question: dbQ.question_text,
    options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    subject: subjectSlug,
    difficulty: (dbQ.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    points: dbQ.points_value || 100,
  };
}

export async function getSubjects(): Promise<DbSubject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
  return (data || []) as DbSubject[];
}

export async function getQuestionsBySubjectSlug(
  subjectSlug: Subject, 
  limit: number = 10
): Promise<Question[]> {
  const subjectName = subjectSlugMap[subjectSlug];
  
  // First get the subject ID from name
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subjectName)
    .maybeSingle();
  
  if (subjectError) {
    console.error('Error fetching subject:', subjectError);
    throw subjectError;
  }
  
  if (!subject) {
    console.log('Subject not found, returning empty array');
    return [];
  }
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subject.id)
    .limit(limit);
  
  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  
  // Shuffle and convert
  const shuffled = ((data || []) as DbQuestion[]).sort(() => Math.random() - 0.5);
  return shuffled.map(q => convertDbQuestion(q, subjectSlug));
}

export async function submitQuizSession(
  userId: string,
  subjectName: string,
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    timeSpent: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>
) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const score = answers.reduce((total, a) => total + a.pointsEarned, 0);
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const totalTime = answers.reduce((t, a) => t + a.timeSpent, 0);
  
  console.log('Submitting quiz session:', { userId, subjectName, score, correctAnswers, totalQuestions });
  
  // Create quiz session
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      subject_name: subjectName,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(2)),
      time_taken: Math.round(totalTime),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (sessionError) {
    console.error('Error creating quiz session:', sessionError);
    throw sessionError;
  }
  
  console.log('Quiz session created:', session);
  
  // Insert all answers
  const userAnswers = answers.map((answer, index) => ({
    session_id: session.id,
    question_id: parseInt(answer.questionId, 10) || null,
    selected_answer: ['A', 'B', 'C', 'D'][answer.selectedAnswer] || 'A',
    is_correct: answer.isCorrect,
    time_spent: Math.round(answer.timeSpent),
    points_earned: answer.pointsEarned,
    answered_at: new Date(Date.now() + index * 100).toISOString(),
  }));
  
  const { error: answersError } = await supabase
    .from('user_answers')
    .insert(userAnswers);
  
  if (answersError) {
    console.error('Error saving answers:', answersError);
    // Don't throw, session is created - answers are secondary
  }
  
  // The trigger `update_user_stats_after_quiz` will handle updating profiles
  // and `sync_leaderboard_trigger` will update leaderboard entries
  
  // Update user streak
  try {
    await supabase.rpc('update_user_streak', { user_uuid: userId });
  } catch (e) {
    console.error('Error updating streak:', e);
  }
  
  // Check and award badges
  try {
    await supabase.rpc('check_and_award_badges', { user_uuid: userId });
  } catch (e) {
    console.error('Error checking badges:', e);
  }
  
  // Recalculate leaderboard ranks
  try {
    await supabase.rpc('recalculate_leaderboard_ranks');
  } catch (e) {
    console.error('Error recalculating ranks:', e);
  }
  
  return { session, score, accuracy: parseFloat(accuracy.toFixed(2)), correctAnswers, totalQuestions };
}
