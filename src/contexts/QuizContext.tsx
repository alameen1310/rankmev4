import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Question, QuizResult, Subject } from '@/types';
import { getQuestionsBySubject } from '@/data/mockData';

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  times: number[];
  isActive: boolean;
  isComplete: boolean;
  subject: Subject | null;
}

interface QuizContextType {
  state: QuizState;
  startQuiz: (subject: Subject) => void;
  answerQuestion: (optionIndex: number, timeSpent: number) => void;
  nextQuestion: () => void;
  getResult: () => QuizResult;
  resetQuiz: () => void;
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
  subject: null,
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuizState>(initialState);

  const startQuiz = useCallback((subject: Subject) => {
    const questions = getQuestionsBySubject(subject);
    setState({
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      times: new Array(questions.length).fill(0),
      isActive: true,
      isComplete: false,
      subject,
    });
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
      if (answers[i] === q.correctIndex) {
        correctAnswers++;
        const timeBonus = Math.max(0, Math.floor((30 - times[i]) / 3) * 10);
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
