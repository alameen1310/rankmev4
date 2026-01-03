-- Update the get_or_create_direct_chat function to use SECURITY DEFINER
-- This allows it to insert into tables even when called by a user with limited RLS access
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Check if a direct chat room already exists between these users
  SELECT crp1.room_id INTO room_id
  FROM chat_room_participants crp1
  JOIN chat_room_participants crp2 ON crp1.room_id = crp2.room_id
  JOIN chat_rooms cr ON cr.id = crp1.room_id
  WHERE crp1.user_id = user1_id 
    AND crp2.user_id = user2_id 
    AND cr.type = 'direct'
  LIMIT 1;
  
  -- If no room exists, create one
  IF room_id IS NULL THEN
    INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO room_id;
    INSERT INTO chat_room_participants (room_id, user_id) VALUES (room_id, user1_id), (room_id, user2_id);
  END IF;
  
  RETURN room_id;
END;
$$;