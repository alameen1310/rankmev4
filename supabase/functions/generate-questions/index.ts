import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const topicToUse = topic || "General";
    const actualCount = Math.min(count, 20);

    console.log(`Generating ${actualCount} ${subject} questions on ${topicToUse}...`);

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

MATH FORMATTING RULES (CRITICAL):
- Write fractions using Unicode fraction slash or superscript/subscript: ½, ⅓, ¼, ⅔, ¾, ⅕, etc.
- For complex fractions, write as: numerator⁄denominator (e.g., 3⁄5, 7⁄12)
- Use Unicode superscripts for powers: x², x³, x⁴, x⁵, x⁶, x⁷, x⁸, x⁹, xⁿ
- Use Unicode subscripts for bases: x₁, x₂, a₀, a₁, base₂, base₈, base₁₀
- Write roots as: √2, √3, ³√8, ⁴√16
- Write trigonometric functions naturally: sin 30°, cos 60°, tan 45°
- Use the degree symbol: 30°, 45°, 60°, 90°
- Use proper math symbols: ×, ÷, ±, ≤, ≥, ≠, ≈, π, θ, α, β, Σ, ∫, ∞
- NEVER use LaTeX notation like \\frac{}{} or \\sqrt{}
- NEVER use ASCII fractions like a/b for math expressions
- Examples: "Find the value of sin² 30° + cos² 60°" NOT "Find the value of sin^2(30)/cos^2(60)"

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 12000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Robust JSON parsing
    const questions = parseAIResponse(content);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Parsed result is not a valid array:", typeof questions);
      throw new Error("AI did not return a valid array of questions");
    }

    console.log(`Parsed ${questions.length} questions, inserting...`);

    // Insert questions into database
    const insertedQuestions = [];
    for (const q of questions) {
      if (!q.question || !q.options) {
        console.warn("Skipping malformed question:", JSON.stringify(q).slice(0, 100));
        continue;
      }

      const questionDifficulty = q.difficulty || (difficulty === "mixed" ? getRandomDifficulty() : difficulty);

      const { data, error } = await supabase
        .from("questions")
        .insert({
          subject_id: subjectData.id,
          question_text: q.question,
          option_a: q.options?.A || q.options?.[0] || q.option_a || "",
          option_b: q.options?.B || q.options?.[1] || q.option_b || "",
          option_c: q.options?.C || q.options?.[2] || q.option_c || "",
          option_d: q.options?.D || q.options?.[3] || q.option_d || "",
          correct_answer: q.correct_answer || q.correctAnswer || "A",
          difficulty: questionDifficulty,
          points_value: getPointsValue(questionDifficulty),
          explanation: q.explanation || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error for question:", error.message);
      } else if (data) {
        insertedQuestions.push(data);
      }
    }

    console.log(`Successfully inserted ${insertedQuestions.length} of ${questions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        subject,
        topic: topicToUse,
        generated: questions.length,
        inserted: insertedQuestions.length,
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

function sanitizeJsonString(str: string): string {
  // Fix control characters AND invalid backslash escapes inside JSON strings
  const validEscapes = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);
  let result = '';
  let inString = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    
    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      result += char;
      continue;
    }
    
    // We are inside a JSON string
    if (char === '\\') {
      const next = str[i + 1];
      if (next && validEscapes.has(next)) {
        // Valid JSON escape sequence - keep as-is
        result += char + next;
        i++; // skip next char
      } else {
        // Invalid escape like \f(rac), \c(os), \s(qrt) — drop the backslash
        // This converts LaTeX \frac to frac, \cos to cos, etc.
        continue;
      }
      continue;
    }
    
    if (char === '"') {
      inString = false;
      result += char;
      continue;
    }
    
    // Escape control characters
    if (char === '\n') { result += '\\n'; continue; }
    if (char === '\r') { result += '\\r'; continue; }
    if (char === '\t') { result += '\\t'; continue; }
    if (code < 0x20) { result += ' '; continue; }
    
    result += char;
  }
  
  return result;
}

function parseAIResponse(content: string): any[] {
  // Step 1: Clean up markdown code blocks
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  // Step 1.5: Sanitize control characters inside JSON strings
  cleaned = sanitizeJsonString(cleaned);

  // Step 2: Try direct parse
  try {
    const result = JSON.parse(cleaned);
    if (Array.isArray(result)) return result;
    if (result.questions && Array.isArray(result.questions)) return result.questions;
    return [];
  } catch {
    // Continue to recovery
  }

  // Step 3: Try to find the JSON array in the content
  const arrayStart = cleaned.indexOf("[");
  if (arrayStart === -1) {
    console.error("No JSON array found in response");
    throw new Error("Failed to parse AI response - no array found");
  }

  let jsonStr = cleaned.slice(arrayStart);

  // Step 4: Try parsing as-is
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Continue to recovery
  }

  // Step 5: Handle truncated JSON - find the last complete object
  console.log("Attempting truncated JSON recovery...");
  
  // Find all complete objects by matching closing braces
  let lastValidEnd = -1;
  let braceDepth = 0;
  let inStr = false;
  let escNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escNext) {
      escNext = false;
      continue;
    }

    if (char === '\\') {
      escNext = true;
      continue;
    }

    if (char === '"') {
      inStr = !inStr;
      continue;
    }

    if (inStr) continue;

    if (char === '{') braceDepth++;
    if (char === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        lastValidEnd = i;
      }
    }
  }

  if (lastValidEnd > 0) {
    // Truncate to last complete object and close the array
    const truncated = jsonStr.slice(0, lastValidEnd + 1) + "]";
    try {
      const result = JSON.parse(truncated);
      console.log(`Recovered ${result.length} questions from truncated response`);
      return result;
    } catch (e) {
      console.error("Recovery parse also failed:", e);
    }
  }

  throw new Error("Failed to parse AI response as JSON");
}

function buildQuestionPrompt(subject: string, topic: string, count: number, difficulty: string): string {
  const difficultyInstruction = difficulty === "mixed"
    ? "Mix of easy (30%), medium (50%), and hard (20%) questions"
    : `All questions should be ${difficulty} difficulty`;

  const mathFormatting = subject === "Mathematics" || subject === "Physics" || subject === "Chemistry"
    ? `
FORMATTING (VERY IMPORTANT):
- Use Unicode for fractions: ½, ⅓, ¼, ⅔, ¾ or numerator⁄denominator format
- Use superscripts for powers: ², ³, ⁴, ⁵ (e.g., x² + 2x + 1)
- Use subscripts for bases/indices: ₁, ₂, ₃ (e.g., log₂ 8, a₁ + a₂)
- Use √ for square root, ³√ for cube root
- Use ° for degrees (e.g., sin 30°, cos 60°)
- Use proper symbols: ×, ÷, ±, ≤, ≥, ≠, ≈, π, θ, ∞
- Write naturally like a textbook, NOT in LaTeX or code format`
    : "";

  return `Generate exactly ${count} JAMB-style ${subject} questions on the topic: "${topic}".

Requirements:
- ${difficultyInstruction}
- Each question must have exactly 4 options labeled A, B, C, D
- Include the correct answer as a single letter (A, B, C, or D)
- Include a brief explanation for each answer
- Questions should be challenging but fair for Nigerian secondary school leavers
- Use proper JAMB formatting and style
${mathFormatting}

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
    "difficulty": "easy",
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
