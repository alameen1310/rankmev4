import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Topic configurations for each subject
const SUBJECT_TOPICS: Record<string, { name: string; count: number }[]> = {
  Mathematics: [
    { name: "Number Bases", count: 80 },
    { name: "Algebra", count: 150 },
    { name: "Geometry", count: 120 },
    { name: "Trigonometry", count: 100 },
    { name: "Calculus", count: 80 },
    { name: "Statistics", count: 80 },
    { name: "Probability", count: 60 },
    { name: "Vectors", count: 60 },
    { name: "Matrices", count: 50 },
    { name: "Logarithms", count: 60 },
    { name: "Indices", count: 50 },
    { name: "Surds", count: 50 },
    { name: "Quadratic Equations", count: 60 },
  ],
  English: [
    { name: "Lexis and Structure", count: 200 },
    { name: "Comprehension", count: 150 },
    { name: "Oral English", count: 120 },
    { name: "Grammar", count: 180 },
    { name: "Vocabulary", count: 150 },
    { name: "Idioms and Proverbs", count: 100 },
    { name: "Antonyms and Synonyms", count: 100 },
  ],
  Physics: [
    { name: "Mechanics", count: 200 },
    { name: "Waves and Optics", count: 120 },
    { name: "Electricity", count: 180 },
    { name: "Modern Physics", count: 100 },
    { name: "Thermodynamics", count: 100 },
    { name: "Electromagnetism", count: 100 },
    { name: "Motion", count: 100 },
    { name: "Energy", count: 100 },
  ],
  Chemistry: [
    { name: "Organic Chemistry", count: 200 },
    { name: "Inorganic Chemistry", count: 180 },
    { name: "Physical Chemistry", count: 150 },
    { name: "Environmental Chemistry", count: 80 },
    { name: "Electrochemistry", count: 80 },
    { name: "Periodic Table", count: 100 },
    { name: "Chemical Bonding", count: 100 },
    { name: "Acids and Bases", count: 110 },
  ],
  Biology: [
    { name: "Cell Biology", count: 150 },
    { name: "Genetics", count: 180 },
    { name: "Ecology", count: 120 },
    { name: "Human Physiology", count: 180 },
    { name: "Plant Physiology", count: 120 },
    { name: "Evolution", count: 80 },
    { name: "Microbiology", count: 80 },
    { name: "Reproduction", count: 90 },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, topic, count = 10, difficulty = "mixed" } = await req.json();

    if (!subject) {
      throw new Error("Subject is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subject ID
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("name", subject)
      .single();

    if (subjectError || !subjectData) {
      throw new Error(`Subject "${subject}" not found`);
    }

    const topicToUse = topic || SUBJECT_TOPICS[subject]?.[0]?.name || "General";
    const actualCount = Math.min(count, 20); // Max 20 questions per request

    console.log(`Generating ${actualCount} ${subject} questions on ${topicToUse}...`);

    // Generate questions using AI
    const prompt = buildQuestionPrompt(subject, topicToUse, actualCount, difficulty);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a JAMB (Joint Admissions and Matriculation Board) question generator for Nigerian students. 
Generate authentic JAMB-style multiple choice questions that:
- Are appropriate for Nigerian secondary school leavers
- Follow official JAMB format and difficulty
- Have exactly 4 options (A, B, C, D)
- Include clear explanations
- Cover the specified topic thoroughly

IMPORTANT: Return ONLY valid JSON array, no markdown, no code blocks.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response
    let questions;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      questions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(questions)) {
      throw new Error("AI did not return an array of questions");
    }

    // Insert questions into database
    const insertedQuestions = [];
    for (const q of questions) {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          subject_id: subjectData.id,
          question_text: q.question,
          option_a: q.options?.A || q.options?.[0] || q.option_a,
          option_b: q.options?.B || q.options?.[1] || q.option_b,
          option_c: q.options?.C || q.options?.[2] || q.option_c,
          option_d: q.options?.D || q.options?.[3] || q.option_d,
          correct_answer: q.correct_answer || q.correctAnswer || "A",
          difficulty: q.difficulty || difficulty === "mixed" ? getRandomDifficulty() : difficulty,
          points_value: getPointsValue(q.difficulty || "medium"),
          explanation: q.explanation || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
      } else if (data) {
        insertedQuestions.push(data);
      }
    }

    // Update subject question count
    await supabase
      .from("subjects")
      .update({ question_count: supabase.rpc("get_question_count", { subject_id: subjectData.id }) })
      .eq("id", subjectData.id);

    console.log(`Successfully inserted ${insertedQuestions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        subject,
        topic: topicToUse,
        generated: questions.length,
        inserted: insertedQuestions.length,
        questions: insertedQuestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildQuestionPrompt(subject: string, topic: string, count: number, difficulty: string): string {
  const difficultyInstruction = difficulty === "mixed" 
    ? "Mix of easy (30%), medium (50%), and hard (20%) questions"
    : `All questions should be ${difficulty} difficulty`;

  return `Generate exactly ${count} JAMB-style ${subject} questions on the topic: "${topic}".

Requirements:
- ${difficultyInstruction}
- Each question must have exactly 4 options labeled A, B, C, D
- Include the correct answer as a single letter (A, B, C, or D)
- Include a brief explanation for each answer
- Questions should be challenging but fair for Nigerian secondary school leavers
- Use proper JAMB formatting and style

Return a JSON array with this exact format:
[
  {
    "question": "The complete question text here",
    "options": {
      "A": "First option",
      "B": "Second option", 
      "C": "Third option",
      "D": "Fourth option"
    },
    "correct_answer": "A",
    "difficulty": "easy|medium|hard",
    "explanation": "Brief explanation of why the answer is correct"
  }
]

Generate ${count} unique, high-quality questions now:`;
}

function getRandomDifficulty(): string {
  const rand = Math.random();
  if (rand < 0.3) return "easy";
  if (rand < 0.8) return "medium";
  return "hard";
}

function getPointsValue(difficulty: string): number {
  switch (difficulty) {
    case "easy": return 10;
    case "medium": return 15;
    case "hard": return 20;
    default: return 15;
  }
}
