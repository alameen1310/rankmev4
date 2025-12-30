import { supabase } from '@/integrations/supabase/client';

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

export async function getQuestionsBySubjectId(
  subjectId: number, 
  limit: number = 10
): Promise<DbQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)
    .limit(limit);
  
  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  
  // Shuffle and return
  return ((data || []) as DbQuestion[]).sort(() => Math.random() - 0.5);
}

export async function getQuestionsBySubjectSlug(
  subjectSlug: string, 
  limit: number = 10
): Promise<DbQuestion[]> {
  // First get the subject ID from slug
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .maybeSingle();
  
  if (subjectError) {
    console.error('Error fetching subject:', subjectError);
    throw subjectError;
  }
  
  if (!subject) {
    console.log('Subject not found, returning empty array');
    return [];
  }
  
  return getQuestionsBySubjectId(subject.id, limit);
}

export async function submitQuizSession(
  userId: string,
  subjectName: string,
  answers: Array<{
    questionId: number;
    selectedAnswer: string;
    timeSpent: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>
) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const score = answers.reduce((total, a) => total + a.pointsEarned, 0);
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const totalTime = answers.reduce((t, a) => t + a.timeSpent, 0) / 1000; // Convert to seconds
  
  // Create quiz session
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      subject_name: subjectName,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy,
      time_taken: Math.round(totalTime),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (sessionError) {
    console.error('Error creating quiz session:', sessionError);
    throw sessionError;
  }
  
  // Insert all answers
  const userAnswers = answers.map((answer, index) => ({
    session_id: session.id,
    question_id: answer.questionId,
    selected_answer: answer.selectedAnswer,
    is_correct: answer.isCorrect,
    time_spent: answer.timeSpent,
    points_earned: answer.pointsEarned,
    answered_at: new Date(Date.now() + index * 100).toISOString(),
  }));
  
  const { error: answersError } = await supabase
    .from('user_answers')
    .insert(userAnswers);
  
  if (answersError) {
    console.error('Error saving answers:', answersError);
    // Don't throw, session is created
  }
  
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
  
  return { session, score, accuracy, correctAnswers, totalQuestions };
}
