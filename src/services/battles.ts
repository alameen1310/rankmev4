import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Question, Subject } from '@/types';
import { getQuestionsBySubjectSlug } from './quiz';

export interface BattleParticipant {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  score: number;
  answers_correct: number;
  ready: boolean;
}

export interface Battle {
  id: string;
  subject_id: number | null;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  is_private: boolean;
  room_code: string | null;
  created_by: string | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  participants: BattleParticipant[];
}

export interface BattleWithQuestions extends Battle {
  questions: Question[];
  currentQuestionIndex: number;
}

// Generate a random room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createBattle(
  userId: string,
  subjectSlug: Subject,
  isPrivate: boolean = false
): Promise<Battle> {
  // Get subject ID from slug
  const subjectNameMap: Record<Subject, string> = {
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'english': 'English',
    'history': 'History',
    'geography': 'Geography',
    'computer-science': 'Computer Science',
  };
  
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subjectNameMap[subjectSlug])
    .maybeSingle();
  
  const roomCode = generateRoomCode();
  
  // Create the battle
  const { data: battle, error } = await supabase
    .from('battles')
    .insert({
      subject_id: subject?.id || null,
      status: 'waiting',
      is_private: isPrivate,
      created_by: userId,
      room_code: roomCode,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating battle:', error);
    throw error;
  }
  
  // Add creator as first participant
  const { error: participantError } = await supabase
    .from('battle_participants')
    .insert({
      battle_id: battle.id,
      user_id: userId,
      ready: true,
      score: 0,
      answers_correct: 0,
    });
  
  if (participantError) {
    console.error('Error adding battle participant:', participantError);
  }
  
  // Pre-generate questions for the battle
  const questions = await getQuestionsBySubjectSlug(subjectSlug, 10);
  
  // Store question IDs in battle_questions table
  const battleQuestions = questions.map((q, index) => ({
    battle_id: battle.id,
    question_id: parseInt(q.id, 10),
    order_index: index,
  }));
  
  if (battleQuestions.length > 0) {
    await supabase.from('battle_questions').insert(battleQuestions);
  }
  
  return {
    ...battle,
    participants: [],
  } as Battle;
}

export async function joinBattle(battleId: string, userId: string): Promise<void> {
  // Check if already joined
  const { data: existing } = await supabase
    .from('battle_participants')
    .select('user_id')
    .eq('battle_id', battleId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existing) {
    throw new Error('Already joined this battle');
  }
  
  // Join the battle
  const { error } = await supabase
    .from('battle_participants')
    .insert({
      battle_id: battleId,
      user_id: userId,
      ready: false,
      score: 0,
      answers_correct: 0,
    });
  
  if (error) {
    console.error('Error joining battle:', error);
    throw error;
  }
  
  // Check if we have enough participants to start
  const { data: participants } = await supabase
    .from('battle_participants')
    .select('user_id')
    .eq('battle_id', battleId);
  
  if (participants && participants.length >= 2) {
    // Update battle status to active
    await supabase
      .from('battles')
      .update({ 
        status: 'active', 
        started_at: new Date().toISOString() 
      })
      .eq('id', battleId);
  }
}

export async function setParticipantReady(battleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('battle_participants')
    .update({ ready: true })
    .eq('battle_id', battleId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error setting participant ready:', error);
    throw error;
  }
  
  // Check if all participants are ready
  const { data: participants } = await supabase
    .from('battle_participants')
    .select('ready')
    .eq('battle_id', battleId);
  
  const allReady = participants && participants.length >= 2 && participants.every(p => p.ready);
  
  if (allReady) {
    await supabase
      .from('battles')
      .update({ 
        status: 'active', 
        started_at: new Date().toISOString() 
      })
      .eq('id', battleId);
  }
}

export async function submitBattleAnswer(
  battleId: string, 
  userId: string, 
  isCorrect: boolean,
  pointsEarned: number
): Promise<void> {
  // Fetch current values first
  const { data: current, error: fetchError } = await supabase
    .from('battle_participants')
    .select('score, answers_correct')
    .eq('battle_id', battleId)
    .eq('user_id', userId)
    .single();
  
  if (fetchError || !current) {
    console.error('Error fetching current battle participant:', fetchError);
    return;
  }
  
  // Update with incremented values
  const { error } = await supabase
    .from('battle_participants')
    .update({
      score: (current.score || 0) + pointsEarned,
      answers_correct: (current.answers_correct || 0) + (isCorrect ? 1 : 0),
    })
    .eq('battle_id', battleId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating battle participant:', error);
  }
}

export async function completeBattle(battleId: string): Promise<string | null> {
  // Get all participants
  const { data: participants } = await supabase
    .from('battle_participants')
    .select('user_id, score')
    .eq('battle_id', battleId)
    .order('score', { ascending: false });
  
  const winnerId = participants && participants.length > 0 ? participants[0].user_id : null;
  
  // Update battle as completed
  const { error } = await supabase
    .from('battles')
    .update({
      status: 'completed',
      winner_id: winnerId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', battleId);
  
  if (error) {
    console.error('Error completing battle:', error);
    throw error;
  }
  
  return winnerId;
}

export async function getBattle(battleId: string): Promise<Battle | null> {
  const { data: battle, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', battleId)
    .single();
  
  if (error || !battle) {
    console.error('Error fetching battle:', error);
    return null;
  }
  
  // Get participants with profiles
  const { data: participants } = await supabase
    .from('battle_participants')
    .select(`
      user_id,
      score,
      answers_correct,
      ready
    `)
    .eq('battle_id', battleId);
  
  // Fetch profiles for participants
  const userIds = (participants || []).map(p => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  const battleParticipants: BattleParticipant[] = (participants || []).map(p => ({
    user_id: p.user_id,
    username: profileMap.get(p.user_id)?.username || null,
    display_name: profileMap.get(p.user_id)?.display_name || null,
    avatar_url: profileMap.get(p.user_id)?.avatar_url || null,
    score: p.score || 0,
    answers_correct: p.answers_correct || 0,
    ready: p.ready || false,
  }));
  
  return {
    ...battle,
    participants: battleParticipants,
  } as Battle;
}

export async function getOpenBattles(limit: number = 10): Promise<Battle[]> {
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('status', 'waiting')
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching open battles:', error);
    return [];
  }
  
  return (data || []).map(b => ({
    ...b,
    participants: [],
  })) as Battle[];
}

export async function joinBattleByRoomCode(
  roomCode: string, 
  userId: string
): Promise<{ success: boolean; battleId?: string; message: string }> {
  try {
    // Find battle by room code
    const { data: battle, error: findError } = await supabase
      .from('battles')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .eq('status', 'waiting')
      .maybeSingle();
    
    if (findError) {
      console.error('Error finding battle:', findError);
      return { success: false, message: 'Error finding battle' };
    }
    
    if (!battle) {
      return { success: false, message: 'Battle not found or already started' };
    }
    
    // Check if user is the creator
    if (battle.created_by === userId) {
      return { success: false, message: 'You created this battle! Waiting for opponent...' };
    }
    
    // Check if already joined
    const { data: existing } = await supabase
      .from('battle_participants')
      .select('user_id')
      .eq('battle_id', battle.id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existing) {
      return { success: false, message: 'You already joined this battle' };
    }
    
    // Get current participant count
    const { data: participants } = await supabase
      .from('battle_participants')
      .select('user_id')
      .eq('battle_id', battle.id);
    
    if (participants && participants.length >= 2) {
      return { success: false, message: 'Battle is full (2/2 players)' };
    }
    
    // Join the battle
    await joinBattle(battle.id, userId);
    
    return { 
      success: true, 
      battleId: battle.id, 
      message: 'Successfully joined! Starting battle...' 
    };
  } catch (error) {
    console.error('Error joining battle by code:', error);
    return { success: false, message: 'Failed to join battle' };
  }
}

export function subscribeToBattle(
  battleId: string,
  onBattleUpdate: (battle: Battle) => void,
  onParticipantUpdate: () => void
): RealtimeChannel {
  const channel = supabase.channel(`battle:${battleId}`);
  
  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`,
      },
      async () => {
        const battle = await getBattle(battleId);
        if (battle) {
          onBattleUpdate(battle);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'battle_participants',
        filter: `battle_id=eq.${battleId}`,
      },
      () => {
        onParticipantUpdate();
      }
    )
    .subscribe();
  
  return channel;
}

export async function inviteFriendToBattle(
  battleId: string, 
  inviterId: string,
  friendId: string
): Promise<void> {
  // Add friend as participant (not ready)
  await supabase
    .from('battle_participants')
    .insert({
      battle_id: battleId,
      user_id: friendId,
      ready: false,
      score: 0,
      answers_correct: 0,
    });
  
  // Send notification
  await supabase
    .from('notifications')
    .insert({
      user_id: friendId,
      type: 'battle_invite',
      title: 'Battle Invitation',
      message: 'You have been invited to a quiz battle!',
      data: { battle_id: battleId, inviter_id: inviterId },
    });
}
