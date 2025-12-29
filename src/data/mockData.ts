import type { User, LeaderboardEntry, Question, Subject, SubjectInfo, Badge, Achievement, Tier } from '@/types';

// Sample names for leaderboard
const names = [
  'Alex Champion', 'Sophia Bright', 'Marcus Lee', 'Emma Watson', 'James Chen',
  'Olivia Smith', 'Noah Brown', 'Ava Johnson', 'William Davis', 'Isabella Garcia',
  'Benjamin Wilson', 'Mia Anderson', 'Lucas Taylor', 'Charlotte Thomas', 'Mason Martinez',
  'Amelia Robinson', 'Ethan Clark', 'Harper Lewis', 'Alexander Hall', 'Evelyn Allen',
  'Daniel Young', 'Abigail King', 'Michael Wright', 'Emily Scott', 'Matthew Green',
  'Elizabeth Baker', 'Sebastian Adams', 'Sofia Nelson', 'David Hill', 'Aria Campbell',
  'Joseph Mitchell', 'Scarlett Roberts', 'Samuel Carter', 'Victoria Phillips', 'Henry Evans',
  'Luna Turner', 'Owen Torres', 'Chloe Parker', 'Jack Edwards', 'Penelope Collins',
  'Levi Stewart', 'Layla Sanchez', 'Isaac Morris', 'Riley Rogers', 'Gabriel Reed',
  'Zoey Cook', 'Anthony Morgan', 'Nora Bell', 'Dylan Murphy', 'Lily Bailey'
];

const countries = [
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Germany', flag: '🇩🇪' },
];

const getTierByPoints = (points: number): Tier => {
  if (points >= 50000) return 'champion';
  if (points >= 30000) return 'diamond';
  if (points >= 15000) return 'platinum';
  if (points >= 7500) return 'gold';
  if (points >= 3000) return 'silver';
  return 'bronze';
};

// Generate 50 leaderboard entries
export const generateLeaderboard = (): LeaderboardEntry[] => {
  return names.map((name, index) => {
    const points = Math.floor(60000 - (index * 1100) + Math.random() * 500);
    const country = countries[Math.floor(Math.random() * countries.length)];
    const changes: ('up' | 'down' | 'same')[] = ['up', 'down', 'same'];
    const change = changes[Math.floor(Math.random() * 3)];
    
    return {
      id: `user-${index + 1}`,
      rank: index + 1,
      username: name,
      points: Math.max(100, points),
      tier: getTierByPoints(Math.max(100, points)),
      country: country.name,
      countryFlag: country.flag,
      change,
      changeAmount: change !== 'same' ? Math.floor(Math.random() * 5) + 1 : undefined,
    };
  });
};

export const leaderboardData = generateLeaderboard();

export const badges: Badge[] = [
  { id: '1', name: 'Math Wizard', description: 'Score 100% on a math quiz', icon: '🧙‍♂️', color: 'purple' },
  { id: '2', name: 'Speed Demon', description: 'Answer 10 questions under 5 seconds each', icon: '⚡', color: 'yellow' },
  { id: '3', name: 'Night Owl', description: 'Study after midnight', icon: '🦉', color: 'indigo' },
  { id: '4', name: 'Perfect Streak', description: 'Maintain a 7-day streak', icon: '🔥', color: 'orange' },
  { id: '5', name: 'Quiz Champion', description: 'Win 50 quizzes', icon: '🏆', color: 'gold' },
  { id: '6', name: 'Rising Star', description: 'Reach Silver tier', icon: '⭐', color: 'silver' },
  { id: '7', name: 'Brain Power', description: 'Answer 1000 questions correctly', icon: '🧠', color: 'pink' },
  { id: '8', name: 'First Steps', description: 'Complete your first quiz', icon: '👣', color: 'green' },
];

export const mockCurrentUser: User = {
  id: 'current-user',
  username: 'StudyMaster',
  email: 'user@example.com',
  points: 12450,
  tier: 'gold',
  rank: 42,
  country: 'Nigeria',
  countryFlag: '🇳🇬',
  streak: 7,
  accuracy: 78,
  totalQuizzes: 156,
  badges: badges.slice(0, 5),
  createdAt: new Date('2024-01-15'),
};

export const subjects: SubjectInfo[] = [
  { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'bg-blue-500', questionsCount: 250 },
  { id: 'physics', name: 'Physics', icon: '⚛️', color: 'bg-purple-500', questionsCount: 180 },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-green-500', questionsCount: 200 },
  { id: 'biology', name: 'Biology', icon: '🧬', color: 'bg-emerald-500', questionsCount: 220 },
  { id: 'english', name: 'English', icon: '📚', color: 'bg-orange-500', questionsCount: 300 },
  { id: 'history', name: 'History', icon: '🏛️', color: 'bg-amber-500', questionsCount: 150 },
  { id: 'geography', name: 'Geography', icon: '🌍', color: 'bg-cyan-500', questionsCount: 130 },
  { id: 'computer-science', name: 'Computer Science', icon: '💻', color: 'bg-indigo-500', questionsCount: 175 },
];

const mathQuestions: Question[] = [
  {
    id: 'm1',
    question: 'What is the derivative of x²?',
    options: ['x', '2x', '2', 'x²'],
    correctIndex: 1,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm2',
    question: 'Solve for x: 2x + 5 = 15',
    options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'],
    correctIndex: 0,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm3',
    question: 'What is the value of π (pi) to 2 decimal places?',
    options: ['3.12', '3.14', '3.16', '3.18'],
    correctIndex: 1,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm4',
    question: 'What is the integral of 2x dx?',
    options: ['x² + C', '2x² + C', 'x + C', '2 + C'],
    correctIndex: 0,
    subject: 'mathematics',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'm5',
    question: 'In a right triangle, if one angle is 30°, what is the other acute angle?',
    options: ['30°', '45°', '60°', '90°'],
    correctIndex: 2,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm6',
    question: 'What is the quadratic formula?',
    options: ['x = -b ± √(b²-4ac) / 2a', 'x = -b ± √(b²+4ac) / 2a', 'x = b ± √(b²-4ac) / 2a', 'x = -b ± √(b²-4ac) / a'],
    correctIndex: 0,
    subject: 'mathematics',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'm7',
    question: 'What is 15% of 200?',
    options: ['15', '20', '30', '35'],
    correctIndex: 2,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm8',
    question: 'What is the sum of angles in a triangle?',
    options: ['90°', '180°', '270°', '360°'],
    correctIndex: 1,
    subject: 'mathematics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'm9',
    question: 'Simplify: (x³)²',
    options: ['x⁵', 'x⁶', 'x⁹', '2x³'],
    correctIndex: 1,
    subject: 'mathematics',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'm10',
    question: 'What is the area of a circle with radius 7?',
    options: ['22π', '49π', '14π', '7π'],
    correctIndex: 1,
    subject: 'mathematics',
    difficulty: 'medium',
    points: 150,
  },
];

const physicsQuestions: Question[] = [
  {
    id: 'p1',
    question: 'What is the SI unit of force?',
    options: ['Joule', 'Watt', 'Newton', 'Pascal'],
    correctIndex: 2,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p2',
    question: 'What is the speed of light in vacuum?',
    options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p3',
    question: 'What is Newton\'s First Law also known as?',
    options: ['Law of Acceleration', 'Law of Inertia', 'Law of Action-Reaction', 'Law of Gravity'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p4',
    question: 'What is the formula for kinetic energy?',
    options: ['KE = mv', 'KE = ½mv²', 'KE = mgh', 'KE = mv²'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'p5',
    question: 'What type of wave is sound?',
    options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'Surface'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p6',
    question: 'What is the acceleration due to gravity on Earth?',
    options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '11.8 m/s²'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p7',
    question: 'What is Ohm\'s Law?',
    options: ['V = IR', 'V = I/R', 'V = I + R', 'V = I - R'],
    correctIndex: 0,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p8',
    question: 'What is the unit of electrical resistance?',
    options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
    correctIndex: 2,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p9',
    question: 'What is the formula for momentum?',
    options: ['p = m/v', 'p = mv', 'p = m + v', 'p = v/m'],
    correctIndex: 1,
    subject: 'physics',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'p10',
    question: 'What phenomenon explains why the sky is blue?',
    options: ['Reflection', 'Refraction', 'Diffraction', 'Scattering'],
    correctIndex: 3,
    subject: 'physics',
    difficulty: 'medium',
    points: 150,
  },
];

const englishQuestions: Question[] = [
  {
    id: 'e1',
    question: 'What is a synonym for "ephemeral"?',
    options: ['Eternal', 'Temporary', 'Beautiful', 'Dangerous'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'e2',
    question: 'Which sentence is grammatically correct?',
    options: ['Me and him went.', 'Him and I went.', 'He and I went.', 'Me and he went.'],
    correctIndex: 2,
    subject: 'english',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'e3',
    question: 'What is the plural of "phenomenon"?',
    options: ['Phenomenons', 'Phenomena', 'Phenomenae', 'Phenomeni'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'e4',
    question: 'Identify the part of speech for "quickly" in: "She ran quickly."',
    options: ['Adjective', 'Adverb', 'Verb', 'Noun'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'e5',
    question: 'What literary device is used in "The wind whispered secrets"?',
    options: ['Simile', 'Metaphor', 'Personification', 'Alliteration'],
    correctIndex: 2,
    subject: 'english',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'e6',
    question: 'What is an antonym for "benevolent"?',
    options: ['Kind', 'Generous', 'Malevolent', 'Gentle'],
    correctIndex: 2,
    subject: 'english',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'e7',
    question: 'Which word is spelled correctly?',
    options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'e8',
    question: 'What is a compound sentence?',
    options: ['Has one subject', 'Has multiple clauses joined by conjunction', 'Has only one verb', 'Is very short'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'medium',
    points: 150,
  },
  {
    id: 'e9',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'easy',
    points: 100,
  },
  {
    id: 'e10',
    question: 'What is the past tense of "swim"?',
    options: ['Swimmed', 'Swam', 'Swum', 'Swimming'],
    correctIndex: 1,
    subject: 'english',
    difficulty: 'easy',
    points: 100,
  },
];

const allQuestions: Record<Subject, Question[]> = {
  mathematics: mathQuestions,
  physics: physicsQuestions,
  chemistry: physicsQuestions.map(q => ({ ...q, id: `c${q.id}`, subject: 'chemistry' as Subject })),
  biology: physicsQuestions.map(q => ({ ...q, id: `b${q.id}`, subject: 'biology' as Subject })),
  english: englishQuestions,
  history: englishQuestions.map(q => ({ ...q, id: `h${q.id}`, subject: 'history' as Subject })),
  geography: englishQuestions.map(q => ({ ...q, id: `g${q.id}`, subject: 'geography' as Subject })),
  'computer-science': mathQuestions.map(q => ({ ...q, id: `cs${q.id}`, subject: 'computer-science' as Subject })),
};

export const getQuestionsBySubject = (subject: Subject): Question[] => {
  return allQuestions[subject] || [];
};

export const achievements: Achievement[] = [
  { id: '1', name: 'First Steps', description: 'Complete your first quiz', icon: '👣', color: 'green', progress: 1, maxProgress: 1, unlocked: true, unlockedAt: new Date(), reward: '50 XP' },
  { id: '2', name: 'Rising Star', description: 'Reach Silver tier', icon: '⭐', color: 'silver', progress: 1, maxProgress: 1, unlocked: true, unlockedAt: new Date(), reward: '100 XP' },
  { id: '3', name: 'Gold Rush', description: 'Reach Gold tier', icon: '🏅', color: 'gold', progress: 1, maxProgress: 1, unlocked: true, unlockedAt: new Date(), reward: '250 XP' },
  { id: '4', name: 'Streak Master', description: 'Maintain a 30-day streak', icon: '🔥', color: 'orange', progress: 7, maxProgress: 30, unlocked: false, reward: '500 XP + Badge' },
  { id: '5', name: 'Quiz Champion', description: 'Win 100 quizzes', icon: '🏆', color: 'gold', progress: 42, maxProgress: 100, unlocked: false, reward: '1000 XP + Badge' },
  { id: '6', name: 'Perfect Score', description: 'Get 100% accuracy on 10 quizzes', icon: '💯', color: 'purple', progress: 3, maxProgress: 10, unlocked: false, reward: '300 XP' },
  { id: '7', name: 'Speed Demon', description: 'Complete a quiz in under 2 minutes', icon: '⚡', color: 'yellow', progress: 0, maxProgress: 1, unlocked: false, reward: '150 XP + Badge' },
  { id: '8', name: 'All-Rounder', description: 'Take quizzes in all subjects', icon: '🌟', color: 'rainbow', progress: 5, maxProgress: 8, unlocked: false, reward: '400 XP' },
];
