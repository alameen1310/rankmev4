import { supabase } from '@/integrations/supabase/client';

export interface DailyChallengeQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  points_value: number;
  subject_id: number;
  correct_answer?: string; // Only available when reviewing after quiz
}

export interface DailyChallenge {
  id: string;
  date: string;
  totalQuestions: number;
  timeLimit: number;
  questions?: DailyChallengeQuestion[];
}

export interface DailyChallengeAttempt {
  id: string;
  user_id: string;
  challenge_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  accuracy: number;
  time_taken_seconds: number;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    tier: string;
  };
}

export interface DailyChallengeResponse {
  completed: boolean;
  challenge: DailyChallenge;
  attempt?: DailyChallengeAttempt;
  rank?: number;
  totalParticipants?: number;
}

export interface SubmitResponse {
  success: boolean;
  attempt: DailyChallengeAttempt;
  rank: number;
  totalParticipants: number;
  percentile: number;
  message: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
  userRank: LeaderboardEntry | null;
  challengeDate: string;
}

export interface HistoryEntry {
  id: string;
  score: number;
  correct_answers: number;
  accuracy: number;
  time_taken_seconds: number;
  completed_at: string;
  daily_challenges: {
    challenge_date: string;
  };
  daily_leaderboards: {
    rank: number;
  }[];
}

export interface HistoryResponse {
  history: HistoryEntry[];
  total: number;
}

export async function getDailyChallenge(): Promise<DailyChallengeResponse> {
  const { data, error } = await supabase.functions.invoke('daily-challenge', {
    body: { action: 'get' },
  });

  if (error) throw error;
  return data;
}

export async function submitDailyChallenge(
  answers: { questionId: number; selectedAnswer: number; timeSpent: number }[],
  totalTime: number
): Promise<SubmitResponse> {
  const { data, error } = await supabase.functions.invoke('daily-challenge', {
    body: { action: 'submit', answers, totalTime },
  });

  if (error) throw error;
  return data;
}

export async function getDailyLeaderboard(
  friendsOnly = false,
  page = 1
): Promise<LeaderboardResponse> {
  const { data, error } = await supabase.functions.invoke('daily-challenge', {
    body: { action: 'leaderboard', friendsOnly, page },
  });

  if (error) throw error;
  return data;
}

export async function getDailyChallengeHistory(page = 1): Promise<HistoryResponse> {
  const { data, error } = await supabase.functions.invoke('daily-challenge', {
    body: { action: 'history', page },
  });

  if (error) throw error;
  return data;
}