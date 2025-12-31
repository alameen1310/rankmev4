import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Question, QuizResult, Subject } from '@/types';
import { getQuestionsBySubjectSlug, submitQuizSession } from '@/services/quiz';
import { getQuestionsBySubject as getMockQuestions } from '@/data/mockData';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  times: number[];
  isActive: boolean;
  isComplete: boolean;
  isLoading: boolean;
  subject: Subject | null;
}

interface QuizContextType {
  state: QuizState;
  startQuiz: (subject: Subject) => Promise<void>;
  answerQuestion: (optionIndex: number, timeSpent: number) => void;
  nextQuestion: () => void;
  getResult: () => QuizResult;
  resetQuiz: () => void;
  submitResults: () => Promise<void>;
  currentQuestion: Question | null;
  progress: number;
}

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  times: [],
  isActive: false,
  isComplete: false,
  isLoading: false,
  subject: null,
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Map subject ID to display name
const subjectNameMap: Record<Subject, string> = {
  'mathematics': 'Mathematics',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'english': 'English',
  'history': 'History',
  'geography': 'Geography',
  'computer-science': 'Computer Science',
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuizState>(initialState);
  const { user, refreshProfile } = useAuth();

  const startQuiz = useCallback(async (subject: Subject) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Try to fetch from database first
      let questions = await getQuestionsBySubjectSlug(subject, 10);
      
      // Fallback to mock data if no DB questions
      if (questions.length === 0) {
        console.log('No DB questions found, using mock data');
        questions = getMockQuestions(subject);
      }
      
      if (questions.length === 0) {
        toast.error('No questions available for this subject');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      setState({
        questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        times: new Array(questions.length).fill(0),
        isActive: true,
        isComplete: false,
        isLoading: false,
        subject,
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      
      // Fallback to mock data on error
      const questions = getMockQuestions(subject);
      setState({
        questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        times: new Array(questions.length).fill(0),
        isActive: true,
        isComplete: false,
        isLoading: false,
        subject,
      });
    }
  }, []);

  const answerQuestion = useCallback((optionIndex: number, timeSpent: number) => {
    setState(prev => {
      const newAnswers = [...prev.answers];
      const newTimes = [...prev.times];
      newAnswers[prev.currentIndex] = optionIndex;
      newTimes[prev.currentIndex] = timeSpent;
      return { ...prev, answers: newAnswers, times: newTimes };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, isComplete: true, isActive: false };
      }
      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const getResult = useCallback((): QuizResult => {
    const { questions, answers, times } = state;
    
    let correctAnswers = 0;
    let totalPoints = 0;
    let perfectStreak = 0;
    let currentStreak = 0;

    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) {
        correctAnswers++;
        // Time bonus: faster answers get more points (max 50% bonus)
        const timeInSeconds = times[i];
        const timeBonus = Math.max(0, Math.floor((30 - timeInSeconds) / 30 * 50));
        totalPoints += q.points + timeBonus;
        currentStreak++;
        perfectStreak = Math.max(perfectStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return {
      totalQuestions: questions.length,
      correctAnswers,
      totalPoints,
      accuracy: questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0,
      averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      perfectStreak,
    };
  }, [state]);

  const submitResults = useCallback(async () => {
    if (!user || !state.subject || state.questions.length === 0) {
      console.log('Cannot submit: missing user, subject, or questions');
      return;
    }

    const { questions, answers, times } = state;
    
    // Build answer array for submission
    const submissionAnswers = questions.map((q, i) => {
      const selectedAnswer = answers[i] ?? 0;
      const isCorrect = selectedAnswer === q.correctIndex;
      const timeInSeconds = times[i] || 0;
      const timeBonus = isCorrect ? Math.max(0, Math.floor((30 - timeInSeconds) / 30 * 50)) : 0;
      const pointsEarned = isCorrect ? q.points + timeBonus : 0;

      return {
        questionId: q.id,
        selectedAnswer,
        timeSpent: timeInSeconds * 1000, // Convert to ms for storage
        isCorrect,
        pointsEarned,
      };
    });

    try {
      const result = await submitQuizSession(
        user.id,
        subjectNameMap[state.subject],
        submissionAnswers
      );
      
      console.log('Quiz submitted successfully:', result);
      toast.success(`+${result.score} points earned!`);
      
      // Refresh the user profile to update points in UI
      await refreshProfile();
    } catch (error) {
      console.error('Error submitting quiz results:', error);
      toast.error('Failed to save your results. Please try again.');
    }
  }, [user, state, refreshProfile]);

  const resetQuiz = useCallback(() => {
    setState(initialState);
  }, []);

  const currentQuestion = state.questions[state.currentIndex] || null;
  const progress = state.questions.length > 0 
    ? ((state.currentIndex + 1) / state.questions.length) * 100 
    : 0;

  return (
    <QuizContext.Provider value={{
      state,
      startQuiz,
      answerQuestion,
      nextQuestion,
      getResult,
      resetQuiz,
      submitResults,
      currentQuestion,
      progress,
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
