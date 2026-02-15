-- SUBJECTS (8 rows)
-- No foreign key dependencies

INSERT INTO public.subjects (id, name, slug, icon, color, description, question_count, created_at) VALUES
(1, 'Mathematics', 'mathematics', '🧮', '#4361EE', 'Algebra, Calculus, Geometry and more', 50, '2025-12-30 12:38:21.395546+00'),
(2, 'Physics', 'physics', '⚛️', '#7C3AED', 'Mechanics, Thermodynamics, Waves', 45, '2025-12-30 12:38:21.395546+00'),
(3, 'Chemistry', 'chemistry', '🧪', '#10B981', 'Organic, Inorganic, Physical Chemistry', 40, '2025-12-30 12:38:21.395546+00'),
(4, 'Biology', 'biology', '🧬', '#F59E0B', 'Cell Biology, Genetics, Ecology', 48, '2025-12-30 12:38:21.395546+00'),
(5, 'English', 'english', '📚', '#EF4444', 'Grammar, Literature, Vocabulary', 55, '2025-12-30 12:38:21.395546+00'),
(6, 'History', 'history', '🏛️', '#8B5CF6', 'World History, Ancient Civilizations', 35, '2025-12-30 12:38:21.395546+00'),
(7, 'Geography', 'geography', '🌍', '#06B6D4', 'Physical and Human Geography', 30, '2025-12-30 12:38:21.395546+00'),
(8, 'Computer Science', 'computer-science', '💻', '#EC4899', 'Programming, Algorithms, Data Structures', 42, '2025-12-30 12:38:21.395546+00');

-- Reset sequence
SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));
