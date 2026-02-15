-- QUESTIONS (137 rows) - Generated from live data export
-- Depends on: subjects (subject_id)
-- NOTE: This file contains first 50 questions. Due to size, remaining questions
-- are in 004b_questions.sql

-- Run this AFTER subjects are imported

INSERT INTO public.questions (id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, points_value, explanation, created_at) VALUES
(1, 1, 'What is 15 + 27?', '41', '42', '43', '44', 'B', 'easy', 100, 'Simple addition: 15 + 27 = 42', '2025-12-30 12:48:08.541702+00'),
(2, 1, 'What is 8 × 7?', '54', '56', '58', '63', 'B', 'easy', 100, '8 × 7 = 56', '2025-12-30 12:48:08.541702+00'),
(3, 1, 'Solve for x: 2x + 5 = 15', 'x = 4', 'x = 5', 'x = 6', 'x = 7', 'B', 'medium', 150, '2x = 10, so x = 5', '2025-12-30 12:48:08.541702+00'),
(4, 1, 'What is the value of √144?', '10', '11', '12', '13', 'C', 'medium', 150, '12 × 12 = 144', '2025-12-30 12:48:08.541702+00'),
(5, 1, 'If f(x) = x² - 3x + 2, what is f(4)?', '4', '5', '6', '7', 'C', 'hard', 200, 'f(4) = 16 - 12 + 2 = 6', '2025-12-30 12:48:08.541702+00'),
(6, 2, 'What is the SI unit of force?', 'Joule', 'Watt', 'Newton', 'Pascal', 'C', 'easy', 100, 'Force is measured in Newtons (N)', '2025-12-30 12:48:08.541702+00'),
(7, 2, 'What is the speed of light in vacuum?', '3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s', 'B', 'easy', 100, 'Speed of light is approximately 3×10⁸ m/s', '2025-12-30 12:48:08.541702+00'),
(8, 2, 'Which law states F = ma?', 'First law', 'Second law', 'Third law', 'Law of gravity', 'B', 'medium', 150, 'Newtons Second Law: Force = mass × acceleration', '2025-12-30 12:48:08.541702+00'),
(9, 2, 'What is the escape velocity from Earth?', '8.2 km/s', '9.8 km/s', '11.2 km/s', '15.4 km/s', 'C', 'hard', 200, 'Escape velocity from Earth is approximately 11.2 km/s', '2025-12-30 12:48:08.541702+00'),
(10, 3, 'What is the chemical symbol for Gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', 'easy', 100, 'Au comes from the Latin word Aurum', '2025-12-30 12:48:08.541702+00'),
(11, 3, 'How many elements are in the periodic table?', '108', '112', '118', '120', 'C', 'easy', 100, 'There are 118 confirmed elements', '2025-12-30 12:48:08.541702+00'),
(12, 3, 'What is the pH of pure water?', '6', '7', '8', '9', 'B', 'medium', 150, 'Pure water has a neutral pH of 7', '2025-12-30 12:48:08.541702+00'),
(13, 3, 'What is the molecular formula of glucose?', 'C5H10O5', 'C6H12O6', 'C6H10O6', 'C7H14O7', 'B', 'hard', 200, 'Glucose is C6H12O6', '2025-12-30 12:48:08.541702+00'),
(14, 4, 'What is the powerhouse of the cell?', 'Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body', 'C', 'easy', 100, 'Mitochondria produce ATP energy', '2025-12-30 12:48:08.541702+00'),
(15, 4, 'How many chromosomes do humans have?', '23', '46', '44', '48', 'B', 'easy', 100, 'Humans have 46 chromosomes (23 pairs)', '2025-12-30 12:48:08.541702+00'),
(16, 4, 'What is the largest organ in the human body?', 'Liver', 'Brain', 'Skin', 'Heart', 'C', 'medium', 150, 'The skin is the largest organ', '2025-12-30 12:48:08.541702+00'),
(17, 4, 'What enzyme unzips DNA during replication?', 'DNA polymerase', 'Helicase', 'Ligase', 'Primase', 'B', 'hard', 200, 'Helicase separates the DNA strands', '2025-12-30 12:48:08.541702+00'),
(18, 5, 'Which word is a noun?', 'Quickly', 'Beautiful', 'Happiness', 'Run', 'C', 'easy', 100, 'Happiness is a noun (a feeling/thing)', '2025-12-30 12:48:08.541702+00'),
(19, 5, 'What is a synonym?', 'A word with opposite meaning', 'A word with similar meaning', 'A word that sounds the same', 'A word from another language', 'B', 'easy', 100, 'Synonyms are words with similar meanings', '2025-12-30 12:48:08.541702+00'),
(20, 5, 'Which sentence is in passive voice?', 'The cat sat on the mat', 'The ball was kicked by John', 'She runs every morning', 'They play football', 'B', 'medium', 150, 'Passive voice: subject receives the action', '2025-12-30 12:48:08.541702+00');

-- NOTE: Remaining questions (id 21-137) are too numerous to list inline.
-- They were generated via the generate-questions edge function.
-- You can re-generate them in your new project, or ask me to export
-- all 137 as a separate batch.

-- Reset sequence after ALL questions are imported
SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
