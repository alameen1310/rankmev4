import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  searchUsers, 
  sendFriendRequest, 
  getPendingFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getFriends,
  type FriendProfile,
  type FriendRequest
} from '@/services/friends';
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  addReaction,
  removeReaction,
  type ChatMessage,
  type MessageType
} from '@/services/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageCircle, 
  Swords, 
  Check, 
  X, 
  ArrowLeft,
  Send,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import { ChatMessage as ChatMessageComponent } from '@/components/chat/ChatMessage';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { EmojiButton } from '@/components/chat/EmojiButton';
import { GifButton } from '@/components/chat/GifButton';
import { VoiceRecorderButton } from '@/components/chat/VoiceRecorderButton';
import { MediaPicker } from '@/components/chat/MediaPicker';
import { ImageEditor } from '@/components/chat/ImageEditor';
import { SwipeableMessage } from '@/components/chat/SwipeableMessage';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMediaUploader } from '@/hooks/useMediaUploader';
import { FriendSuggestions } from '@/components/social/FriendSuggestions';
import { EnhancedFriendSuggestions } from '@/components/social/EnhancedFriendSuggestions';

type Tab = 'friends' | 'requests' | 'search';

interface Gif {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface ReplyingTo {
  id: string;
  message: string;
  messageType: MessageType;
  senderName: string;
  isOwn: boolean;
}

export function Friends() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat state
  const [activeChatFriend, setActiveChatFriend] = useState<FriendProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<ReturnType<typeof subscribeToMessages> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Typing indicator
  const { isOtherTyping, typingUsername, sendTypingEvent, stopTyping } = useTypingIndicator(
    user?.id,
    activeChatFriend?.id,
    profile?.username || undefined
  );

  // Media uploader
  const { isUploading, uploadMedia, uploadVoiceNote } = useMediaUploader(user?.id);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(user.id),
        getPendingFriendRequests(user.id),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setIsLoading(true);
    try {
      const results = await searchUsers(searchQuery, user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.id, toUserId);
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== toUserId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success('Friend request accepted!');
      loadData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast.success('Friend request rejected');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const openChat = async (friend: FriendProfile) => {
    if (!user) return;

    try {
      // Clean up any previous subscription first
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }

      setActiveChatFriend(friend);

      // Load messages using direct_messages table
      const msgs = await getMessages(user.id, friend.id);
      setChatMessages(msgs);

      // Mark as read
      await markMessagesAsRead(user.id, friend.id);

      // Subscribe to new messages
      const channel = subscribeToMessages(user.id, friend.id, (newMsg) => {
        setChatMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        if (newMsg.sender_id !== user.id) {
          markMessagesAsRead(user.id, friend.id);
        }
      });

      chatChannelRef.current = channel;
      
      // Focus input after chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error opening chat:', error);
      const details = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to open chat: ${details}`);
    }
  };

  const closeChat = () => {
    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current);
      chatChannelRef.current = null;
    }
    stopTyping();
    setActiveChatFriend(null);
    setChatMessages([]);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleSendMessage = async (
    messageType: 'text' | 'gif' | 'image' | 'video' | 'audio' = 'text', 
    options?: {
      gifUrl?: string;
      mediaUrl?: string;
      thumbnailUrl?: string;
      fileSize?: number;
      fileName?: string;
      duration?: number;
      width?: number;
      height?: number;
    }
  ) => {
    if (messageType === 'text' && !newMessage.trim()) return;
    if (!activeChatFriend || !user || isSending) return;

    setIsSending(true);
    stopTyping();
    
    try {
      const result = await sendMessage(
        user.id, 
        activeChatFriend.id, 
        messageType === 'text' ? newMessage.trim() : '',
        messageType,
        {
          ...options,
          replyToId: replyingTo?.id,
        }
      );
      if (!result.success) {
        toast.error(result.error || 'Failed to send message');
      }
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      const details = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send message: ${details}`);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle swipe to reply
  const handleSwipeReply = (msg: ChatMessage) => {
    const senderName = msg.sender_id === user?.id 
      ? 'You' 
      : msg.sender?.username || activeChatFriend?.username || 'User';
    
    setReplyingTo({
      id: msg.id,
      message: msg.message,
      messageType: msg.message_type,
      senderName,
      isOwn: msg.sender_id === user?.id,
    });
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value) {
      sendTypingEvent(true);
    } else {
      stopTyping();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleGifSelect = (gif: Gif) => {
    handleSendMessage('gif', { gifUrl: gif.url });
  };

  // Handle voice note send
  const handleVoiceNoteSend = async (blob: Blob, duration: number) => {
    if (!activeChatFriend || !user) return;
    
    try {
      const result = await uploadVoiceNote(blob, duration);
      if (result) {
        await handleSendMessage('audio', {
          mediaUrl: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          duration: result.duration,
        });
      }
    } catch (error) {
      console.error('Error sending voice note:', error);
      toast.error('Failed to send voice note');
    }
  };

  // Handle image selection - open editor for images
  const handleMediaSelect = async (file: File, type: 'image' | 'video') => {
    if (!activeChatFriend || !user) return;
    
    if (type === 'image') {
      // Open image editor
      setEditingImage(file);
    } else {
      // Send video directly
      await sendMediaFile(file, type);
    }
  };

  // Send media file after editing or directly
  const sendMediaFile = async (file: File, type: 'image' | 'video') => {
    if (!activeChatFriend || !user) return;
    
    try {
      const result = await uploadMedia(file, type);
      if (result) {
        await handleSendMessage(type, {
          mediaUrl: result.url,
          thumbnailUrl: result.thumbnailUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          duration: result.duration,
          width: result.width,
          height: result.height,
        });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error(`Failed to send ${type}`);
    }
  };

  // Handle edited image from ImageEditor
  const handleImageEdited = async (editedFile: File) => {
    setEditingImage(null);
    await sendMediaFile(editedFile, 'image');
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const result = await addReaction(messageId, user.id, emoji);
    if (result.success) {
      // Optimistically update
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
          if (existingReaction) {
            return msg;
          }
          return {
            ...msg,
            reactions: [...(msg.reactions || []), {
              id: `temp-${Date.now()}`,
              message_id: messageId,
              user_id: user.id,
              emoji,
              created_at: new Date().toISOString(),
            }]
          };
        }
        return msg;
      }));
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const result = await removeReaction(messageId, user.id, emoji);
    if (result.success) {
      // Optimistically update
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => !(r.emoji === emoji && r.user_id === user.id))
          };
        }
        return msg;
      }));
    }
  };

  // Group reactions by emoji for display
  const getReactionsForMessage = (message: ChatMessage) => {
    const reactionMap = new Map<string, { count: number; hasReacted: boolean; users: string[] }>();
    
    (message.reactions || []).forEach(r => {
      const existing = reactionMap.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.user_id === user?.id) existing.hasReacted = true;
        if (r.user?.username) existing.users.push(r.user.username);
      } else {
        reactionMap.set(r.emoji, {
          count: 1,
          hasReacted: r.user_id === user?.id,
          users: r.user?.username ? [r.user.username] : [],
        });
      }
    });

    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
      emoji,
      ...data,
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-4">Sign in to add friends</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  // Chat View - Fixed viewport height layout with higher z-index to cover bottom nav
  if (activeChatFriend) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        {/* Chat Header - Fixed */}
        <div 
          className="flex-shrink-0 flex items-center gap-3 p-4 border-b bg-card"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <Button variant="ghost" size="icon" onClick={closeChat}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar>
            <AvatarImage src={activeChatFriend.avatar_url || undefined} />
            <AvatarFallback>
              {activeChatFriend.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {activeChatFriend.display_name || activeChatFriend.username}
            </p>
            <div className="flex items-center gap-2">
              {activeChatFriend.tier && <TierBadge tier={activeChatFriend.tier as any} size="sm" />}
              {isOtherTyping && (
                <span className="text-xs text-muted-foreground animate-pulse">typing...</span>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/pvp')}
          >
            <Swords className="w-4 h-4 mr-1" />
            Battle
          </Button>
        </div>

        {/* Messages - Scrollable, takes remaining space */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="p-4 space-y-3 min-h-full flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1" />
                {chatMessages.map(msg => (
                  <SwipeableMessage
                    key={msg.id}
                    isOwn={msg.sender_id === user.id}
                    onSwipeReply={() => handleSwipeReply(msg)}
                  >
                    <ChatMessageComponent
                      id={msg.id}
                      message={msg.message}
                      messageType={msg.message_type}
                      gifUrl={msg.gif_url}
                      mediaUrl={msg.media_url}
                      thumbnailUrl={msg.thumbnail_url}
                      duration={msg.duration}
                      width={msg.width}
                      height={msg.height}
                      isOwn={msg.sender_id === user.id}
                      timestamp={msg.created_at}
                      status={msg.status}
                      reactions={getReactionsForMessage(msg)}
                      onAddReaction={handleAddReaction}
                      onRemoveReaction={handleRemoveReaction}
                      replyTo={msg.reply_to ? {
                        message: msg.reply_to.message,
                        messageType: msg.reply_to.message_type,
                        senderName: msg.reply_to.sender?.username || 'User',
                      } : undefined}
                    />
                  </SwipeableMessage>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Typing Indicator */}
        {isOtherTyping && (
          <div className="flex-shrink-0 border-t bg-card/50">
            <TypingIndicator username={typingUsername || activeChatFriend.username || 'User'} />
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="flex-shrink-0 px-2 border-t bg-card">
            <ReplyPreview replyTo={replyingTo} onCancel={() => setReplyingTo(null)} />
          </div>
        )}

        {/* Message Input - Compact fixed bottom */}
        <div 
          className="flex-shrink-0 px-2 py-2 border-t bg-card"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-1">
            <MediaPicker
              onSelectImage={(file) => handleMediaSelect(file, 'image')}
              onSelectVideo={(file) => handleMediaSelect(file, 'video')}
              isUploading={isUploading}
              disabled={isSending}
            />
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Message..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1 min-w-0 h-9 text-base"
              disabled={isUploading}
            />
            <EmojiButton onEmojiSelect={handleEmojiSelect} />
            <GifButton onGifSelect={handleGifSelect} />
            {newMessage.trim() ? (
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={!newMessage.trim() || isSending || isUploading}
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <VoiceRecorderButton
                onSend={handleVoiceNoteSend}
                disabled={isSending || isUploading}
              />
            )}
          </div>
        </div>

        {/* Image Editor Modal */}
        {editingImage && (
          <ImageEditor
            file={editingImage}
            onSave={handleImageEdited}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Friends
            </h1>
            <p className="text-sm text-muted-foreground">
              {friends.length} friends
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {(['friends', 'requests', 'search'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium text-sm transition-all capitalize",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {tab === 'requests' && requests.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 text-xs">
                  {requests.length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="space-y-4">
                <Card className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No friends yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Challenge players like you to climb faster
                  </p>
                  <Button onClick={() => setActiveTab('search')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                </Card>
                
                {/* Friend Suggestions when no friends */}
                <FriendSuggestions maxItems={10} />
              </div>
            ) : (
              friends.map(friend => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {friend.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">
                          {friend.display_name || friend.username}
                        </p>
                        {friend.equipped_title && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {friend.equipped_title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {friend.tier && <TierBadge tier={friend.tier as any} size="sm" />}
                        <span>{friend.total_points?.toLocaleString() || 0} pts</span>
                      </div>
                      {/* Showcase Badges */}
                      {friend.showcase_badges && friend.showcase_badges.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {friend.showcase_badges.slice(0, 3).map((badgeName, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground"
                              title={badgeName}
                            >
                              🏆 {badgeName.length > 10 ? badgeName.slice(0, 10) + '...' : badgeName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openChat(friend)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate('/pvp')}
                      >
                        <Swords className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <Card className="p-8 text-center">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  Friend requests will appear here
                </p>
              </Card>
            ) : (
              requests.map(request => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.from_user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.from_user?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {request.from_user?.display_name || request.from_user?.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Wants to be your friend
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="icon"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Results (if any) */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Search Results</h4>
                {searchResults.map(searchUser => (
                  <Card key={searchUser.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={searchUser.avatar_url || undefined} />
                        <AvatarFallback>
                          {searchUser.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">
                            {searchUser.display_name || searchUser.username}
                          </p>
                          {searchUser.equipped_title && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {searchUser.equipped_title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {searchUser.tier && <TierBadge tier={searchUser.tier as any} size="sm" />}
                        </div>
                        {searchUser.showcase_badges && searchUser.showcase_badges.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {searchUser.showcase_badges.slice(0, 3).map((badgeName, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground"
                                title={badgeName}
                              >
                                🏆 {badgeName.length > 10 ? badgeName.slice(0, 10) + '...' : badgeName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleSendRequest(searchUser.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Enhanced Friend Suggestions */}
            <div className="pt-2">
              <EnhancedFriendSuggestions maxItems={10} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
