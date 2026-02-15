-- BADGES (15 rows)
-- No foreign key dependencies

INSERT INTO public.badges (id, name, description, icon, requirement_type, requirement_value, tier, created_at) VALUES
(1, 'First Steps', 'Complete your first quiz', '🎯', 'quizzes', 1, 'bronze', '2025-12-30 12:38:21.395546+00'),
(2, 'Quick Learner', 'Complete 10 quizzes', '📖', 'quizzes', 10, 'bronze', '2025-12-30 12:38:21.395546+00'),
(3, 'Dedicated Student', 'Complete 50 quizzes', '🎓', 'quizzes', 50, 'silver', '2025-12-30 12:38:21.395546+00'),
(4, 'Quiz Master', 'Complete 100 quizzes', '👑', 'quizzes', 100, 'gold', '2025-12-30 12:38:21.395546+00'),
(5, 'Point Collector', 'Earn 1,000 points', '💎', 'points', 1000, 'bronze', '2025-12-30 12:38:21.395546+00'),
(6, 'Rising Star', 'Earn 5,000 points', '⭐', 'points', 5000, 'silver', '2025-12-30 12:38:21.395546+00'),
(7, 'Point Legend', 'Earn 25,000 points', '🏆', 'points', 25000, 'gold', '2025-12-30 12:38:21.395546+00'),
(8, 'Champion', 'Earn 100,000 points', '👑', 'points', 100000, 'diamond', '2025-12-30 12:38:21.395546+00'),
(9, 'Streak Starter', 'Maintain a 3-day streak', '🔥', 'streak', 3, 'bronze', '2025-12-30 12:38:21.395546+00'),
(10, 'Week Warrior', 'Maintain a 7-day streak', '💪', 'streak', 7, 'silver', '2025-12-30 12:38:21.395546+00'),
(11, 'Streak Master', 'Maintain a 30-day streak', '🌟', 'streak', 30, 'gold', '2025-12-30 12:38:21.395546+00'),
(12, 'Unstoppable', 'Maintain a 100-day streak', '🚀', 'streak', 100, 'diamond', '2025-12-30 12:38:21.395546+00'),
(13, 'Sharp Mind', 'Achieve 80% accuracy', '🧠', 'accuracy', 80, 'silver', '2025-12-30 12:38:21.395546+00'),
(14, 'Precision Expert', 'Achieve 90% accuracy', '🎯', 'accuracy', 90, 'gold', '2025-12-30 12:38:21.395546+00'),
(15, 'Perfectionist', 'Achieve 95% accuracy', '💯', 'accuracy', 95, 'platinum', '2025-12-30 12:38:21.395546+00');

-- Reset sequence
SELECT setval('badges_id_seq', (SELECT MAX(id) FROM badges));
