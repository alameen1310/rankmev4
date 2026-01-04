import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingState {
  isTyping: boolean;
  userId: string;
  username: string;
}

export function useTypingIndicator(
  userId: string | undefined,
  friendId: string | undefined,
  username: string | undefined
) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUsername, setTypingUsername] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Subscribe to typing events
  useEffect(() => {
    if (!userId || !friendId) return;

    const channelName = `typing:${[userId, friendId].sort().join(':')}`;
    
    channelRef.current = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    channelRef.current
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as TypingState;
        if (data.userId === friendId && data.isTyping) {
          setIsOtherTyping(true);
          setTypingUsername(data.username);
          
          // Clear typing after 3 seconds of no activity
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3000);
        } else if (data.userId === friendId && !data.isTyping) {
          setIsOtherTyping(false);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, friendId]);

  // Send typing event (debounced to every 500ms)
  const sendTypingEvent = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !userId || !username) return;
    
    const now = Date.now();
    if (isTyping && now - lastTypingSentRef.current < 500) return;
    
    lastTypingSentRef.current = now;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        isTyping,
        userId,
        username,
      } as TypingState,
    });
  }, [userId, username]);

  // Stop typing event
  const stopTyping = useCallback(() => {
    sendTypingEvent(false);
  }, [sendTypingEvent]);

  return {
    isOtherTyping,
    typingUsername,
    sendTypingEvent,
    stopTyping,
  };
}
