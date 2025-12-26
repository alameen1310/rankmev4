export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'champion';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  points: number;
  tier: Tier;
  rank: number;
  country: string;
  countryFlag: string;
  streak: number;
  accuracy: number;
  totalQuizzes: number;
  badges: Badge[];
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: Date;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatar?: string;
  points: number;
  tier: Tier;
  country: string;
  countryFlag: string;
  change: 'up' | 'down' | 'same';
  changeAmount?: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  subject: Subject;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  accuracy: number;
  averageTime: number;
  perfectStreak: number;
}

export type Subject = 
  | 'mathematics' 
  | 'physics' 
  | 'chemistry' 
  | 'biology' 
  | 'english' 
  | 'history' 
  | 'geography'
  | 'computer-science';

export interface SubjectInfo {
  id: Subject;
  name: string;
  icon: string;
  color: string;
  questionsCount: number;
}

export type LeaderboardTab = 'global' | 'country' | 'friends' | 'subjects';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}
