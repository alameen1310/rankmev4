import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyChallengeRequest {
  action: 'get' | 'submit' | 'leaderboard' | 'history';
  answers?: {
    questionId: number;
    selectedAnswer: number;
    timeSpent: number;
  }[];
  totalTime?: number;
  page?: number;
  friendsOnly?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DailyChallengeRequest = await req.json();
    const { action } = body;

    // Get or create today's challenge
    const today = new Date().toISOString().split('T')[0];
    
    if (action === 'get') {
      // Check if challenge exists for today
      let { data: challenge } = await supabaseAdmin
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .single();

      if (!challenge) {
        // Create new challenge with random questions
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('id')
          .limit(100);

        if (!questions || questions.length < 10) {
          return new Response(JSON.stringify({ 
            error: 'Not enough questions available for daily challenge' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Shuffle and pick 10 random questions
        const shuffled = questions.sort(() => Math.random() - 0.5);
        const selectedIds = shuffled.slice(0, 10).map(q => q.id);

        const { data: newChallenge, error: createError } = await supabaseAdmin
          .from('daily_challenges')
          .insert({
            challenge_date: today,
            question_ids: selectedIds,
            total_questions: 10,
            time_limit_seconds: 600,
          })
          .select()
          .single();

        if (createError) {
          // Check if another process created it
          const { data: existingChallenge } = await supabaseAdmin
            .from('daily_challenges')
            .select('*')
            .eq('challenge_date', today)
            .single();
          
          if (existingChallenge) {
            challenge = existingChallenge;
          } else {
            throw createError;
          }
        } else {
          challenge = newChallenge;
        }
      }

      // Check if user has already attempted today
      const { data: attempt } = await supabaseAdmin
        .from('daily_challenge_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .single();

      if (attempt) {
        // User already completed - return their result
        const { data: userRank } = await supabaseAdmin
          .from('daily_leaderboards')
          .select('rank')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .single();

        const { data: totalParticipants } = await supabaseAdmin
          .from('daily_challenge_attempts')
          .select('id', { count: 'exact' })
          .eq('challenge_id', challenge.id);

        return new Response(JSON.stringify({
          completed: true,
          attempt,
          rank: userRank?.rank || 0,
          totalParticipants: totalParticipants?.length || 0,
          challenge: {
            id: challenge.id,
            date: challenge.challenge_date,
            totalQuestions: challenge.total_questions,
            timeLimit: challenge.time_limit_seconds,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch questions for the challenge
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, difficulty, points_value, subject_id')
        .in('id', challenge.question_ids);

      // Shuffle questions to randomize order while keeping same questions for all users
      const orderedQuestions = challenge.question_ids.map((qId: number) => 
        questions?.find(q => q.id === qId)
      ).filter(Boolean);

      return new Response(JSON.stringify({
        completed: false,
        challenge: {
          id: challenge.id,
          date: challenge.challenge_date,
          totalQuestions: challenge.total_questions,
          timeLimit: challenge.time_limit_seconds,
          questions: orderedQuestions,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'submit') {
      const { answers, totalTime } = body;

      if (!answers || !Array.isArray(answers)) {
        return new Response(JSON.stringify({ error: 'Answers are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get today's challenge
      const { data: challenge } = await supabaseAdmin
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .single();

      if (!challenge) {
        return new Response(JSON.stringify({ error: 'No challenge found for today' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already attempted
      const { data: existingAttempt } = await supabaseAdmin
        .from('daily_challenge_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .single();

      if (existingAttempt) {
        return new Response(JSON.stringify({ error: 'You have already completed today\'s challenge' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch correct answers
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id, correct_answer, points_value')
        .in('id', challenge.question_ids);

      if (!questions) {
        return new Response(JSON.stringify({ error: 'Could not fetch questions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate score
      let score = 0;
      let correctCount = 0;
      const answerMap = ['A', 'B', 'C', 'D'];

      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (question) {
          const selectedLetter = answerMap[answer.selectedAnswer];
          const isCorrect = selectedLetter === question.correct_answer;
          
          if (isCorrect) {
            correctCount++;
            // Base points + time bonus (faster = more points)
            const basePoints = question.points_value || 100;
            const timeBonus = Math.max(0, Math.floor((30 - answer.timeSpent) / 30 * 50));
            score += basePoints + timeBonus;
          }
        }
      }

      const accuracy = (correctCount / challenge.total_questions) * 100;
      const timeTaken = totalTime || 0;

      // Insert attempt
      const { data: attempt, error: attemptError } = await supabaseAdmin
        .from('daily_challenge_attempts')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          score,
          correct_answers: correctCount,
          total_questions: challenge.total_questions,
          accuracy,
          time_taken_seconds: timeTaken,
        })
        .select()
        .single();

      if (attemptError) {
        console.error('Attempt insert error:', attemptError);
        return new Response(JSON.stringify({ error: 'Failed to save attempt' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's rank
      const { data: leaderboard } = await supabaseAdmin
        .from('daily_leaderboards')
        .select('rank')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .single();

      const { data: totalParticipants } = await supabaseAdmin
        .from('daily_challenge_attempts')
        .select('id', { count: 'exact' })
        .eq('challenge_id', challenge.id);

      const rank = leaderboard?.rank || 1;
      const total = totalParticipants?.length || 1;
      const percentile = Math.round(((total - rank + 1) / total) * 100);

      return new Response(JSON.stringify({
        success: true,
        attempt,
        rank,
        totalParticipants: total,
        percentile,
        message: `You beat ${percentile}% of players today!`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leaderboard') {
      const { friendsOnly = false, page = 1 } = body;
      const limit = 50;
      const offset = (page - 1) * limit;

      // Get today's challenge
      const { data: challenge } = await supabaseAdmin
        .from('daily_challenges')
        .select('id')
        .eq('challenge_date', today)
        .single();

      if (!challenge) {
        return new Response(JSON.stringify({ leaderboard: [], total: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabaseAdmin
        .from('daily_leaderboards')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            tier
          )
        `)
        .eq('challenge_id', challenge.id)
        .order('rank', { ascending: true });

      if (friendsOnly) {
        // Get user's friends
        const { data: friendships } = await supabaseAdmin
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id);

        const friendIds = friendships?.map(f => f.friend_id) || [];
        friendIds.push(user.id); // Include self

        query = query.in('user_id', friendIds);
      }

      const { data: leaderboard, count } = await query
        .range(offset, offset + limit - 1);

      // Get user's rank
      const { data: userRank } = await supabaseAdmin
        .from('daily_leaderboards')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .single();

      return new Response(JSON.stringify({
        leaderboard: leaderboard || [],
        total: count || 0,
        userRank: userRank || null,
        challengeDate: today,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'history') {
      const { page = 1 } = body;
      const limit = 20;
      const offset = (page - 1) * limit;

      const { data: history, count } = await supabaseAdmin
        .from('daily_challenge_attempts')
        .select(`
          *,
          daily_challenges (
            challenge_date
          ),
          daily_leaderboards!inner (
            rank
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return new Response(JSON.stringify({
        history: history || [],
        total: count || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Daily challenge error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
