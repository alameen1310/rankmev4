import { supabase } from '@/integrations/supabase/client';

export interface GenerationResult {
  success: boolean;
  subject: string;
  topic?: string;
  generated: number;
  inserted: number;
  error?: string;
}

export interface GenerationProgress {
  subject: string;
  topic: string;
  current: number;
  total: number;
  inserted: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
}

// Subject topics configuration
export const SUBJECT_TOPICS: Record<string, { name: string; targetCount: number }[]> = {
  Mathematics: [
    { name: "Number Bases", targetCount: 80 },
    { name: "Algebra", targetCount: 150 },
    { name: "Geometry", targetCount: 120 },
    { name: "Trigonometry", targetCount: 100 },
    { name: "Calculus", targetCount: 80 },
    { name: "Statistics", targetCount: 80 },
    { name: "Probability", targetCount: 60 },
    { name: "Vectors", targetCount: 60 },
    { name: "Matrices", targetCount: 50 },
    { name: "Logarithms", targetCount: 60 },
    { name: "Indices", targetCount: 50 },
    { name: "Surds", targetCount: 50 },
    { name: "Quadratic Equations", targetCount: 60 },
  ],
  English: [
    { name: "Lexis and Structure", targetCount: 200 },
    { name: "Comprehension", targetCount: 150 },
    { name: "Oral English", targetCount: 120 },
    { name: "Grammar", targetCount: 180 },
    { name: "Vocabulary", targetCount: 150 },
    { name: "Idioms and Proverbs", targetCount: 100 },
    { name: "Antonyms and Synonyms", targetCount: 100 },
  ],
  Physics: [
    { name: "Mechanics", targetCount: 200 },
    { name: "Waves and Optics", targetCount: 120 },
    { name: "Electricity", targetCount: 180 },
    { name: "Modern Physics", targetCount: 100 },
    { name: "Thermodynamics", targetCount: 100 },
    { name: "Electromagnetism", targetCount: 100 },
    { name: "Motion", targetCount: 100 },
    { name: "Energy", targetCount: 100 },
  ],
  Chemistry: [
    { name: "Organic Chemistry", targetCount: 200 },
    { name: "Inorganic Chemistry", targetCount: 180 },
    { name: "Physical Chemistry", targetCount: 150 },
    { name: "Environmental Chemistry", targetCount: 80 },
    { name: "Electrochemistry", targetCount: 80 },
    { name: "Periodic Table", targetCount: 100 },
    { name: "Chemical Bonding", targetCount: 100 },
    { name: "Acids and Bases", targetCount: 110 },
  ],
  Biology: [
    { name: "Cell Biology", targetCount: 150 },
    { name: "Genetics", targetCount: 180 },
    { name: "Ecology", targetCount: 120 },
    { name: "Human Physiology", targetCount: 180 },
    { name: "Plant Physiology", targetCount: 120 },
    { name: "Evolution", targetCount: 80 },
    { name: "Microbiology", targetCount: 80 },
    { name: "Reproduction", targetCount: 90 },
  ],
};

export async function generateQuestions(
  subject: string,
  topic: string,
  count: number = 10,
  difficulty: string = 'mixed'
): Promise<GenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-questions', {
      body: { subject, topic, count, difficulty },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        subject,
        topic,
        generated: 0,
        inserted: 0,
        error: error.message,
      };
    }

    return data as GenerationResult;
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      subject,
      generated: 0,
      inserted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getQuestionCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('subjects')
    .select('name, question_count');

  if (error) {
    console.error('Error fetching question counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const subject of data || []) {
    counts[subject.name] = subject.question_count || 0;
  }
  return counts;
}

export async function getActualQuestionCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('questions')
    .select('subject_id, subjects!inner(name)');

  if (error) {
    console.error('Error fetching actual counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const q of data || []) {
    const subjectName = (q.subjects as { name: string })?.name;
    if (subjectName) {
      counts[subjectName] = (counts[subjectName] || 0) + 1;
    }
  }
  return counts;
}

export async function bulkGenerateQuestions(
  subject: string,
  onProgress: (progress: GenerationProgress) => void
): Promise<{ totalGenerated: number; totalInserted: number }> {
  const topics = SUBJECT_TOPICS[subject];
  if (!topics) {
    throw new Error(`Unknown subject: ${subject}`);
  }

  let totalGenerated = 0;
  let totalInserted = 0;
  const batchSize = 15; // Questions per request

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
    const topic = topics[topicIndex];
    const batches = Math.ceil(topic.targetCount / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const count = Math.min(batchSize, topic.targetCount - batch * batchSize);

      onProgress({
        subject,
        topic: topic.name,
        current: batch + 1,
        total: batches,
        inserted: totalInserted,
        status: 'generating',
      });

      try {
        const result = await generateQuestions(subject, topic.name, count);

        if (result.success) {
          totalGenerated += result.generated;
          totalInserted += result.inserted;
        } else {
          console.error(`Batch error for ${topic.name}:`, result.error);
        }

        // Small delay between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error generating ${topic.name} batch ${batch}:`, error);
        onProgress({
          subject,
          topic: topic.name,
          current: batch + 1,
          total: batches,
          inserted: totalInserted,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    onProgress({
      subject,
      topic: topic.name,
      current: batches,
      total: batches,
      inserted: totalInserted,
      status: 'completed',
    });
  }

  return { totalGenerated, totalInserted };
}

export function getTotalTargetQuestions(subject: string): number {
  const topics = SUBJECT_TOPICS[subject];
  if (!topics) return 0;
  return topics.reduce((sum, topic) => sum + topic.targetCount, 0);
}

export function getAllSubjects(): string[] {
  return Object.keys(SUBJECT_TOPICS);
}
