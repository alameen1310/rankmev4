import { useState, useEffect, useRef } from 'react';
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
  getOrCreateDirectChat,
  getChatMessages,
  sendMessage,
  subscribeToChatRoom,
  markRoomAsRead,
  type ChatMessage
} from '@/services/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type Tab = 'friends' | 'requests' | 'search';

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
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const roomId = await getOrCreateDirectChat(user.id, friend.id);
      setChatRoomId(roomId);
      setActiveChatFriend(friend);
      
      // Load messages
      const chatMessages = await getChatMessages(roomId);
      setMessages(chatMessages);
      
      // Mark as read
      await markRoomAsRead(roomId, user.id);
      
      // Subscribe to new messages
      const channel = subscribeToChatRoom(roomId, (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.sender_id !== user.id) {
          markRoomAsRead(roomId, user.id);
        }
      });
      
      return () => supabase.removeChannel(channel);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat');
    }
  };

  const closeChat = () => {
    setActiveChatFriend(null);
    setChatRoomId(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !user || isSending) return;
    
    setIsSending(true);
    try {
      await sendMessage(chatRoomId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
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

  // Chat View
  if (activeChatFriend) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={closeChat}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar>
            <AvatarImage src={activeChatFriend.avatar_url || undefined} />
            <AvatarFallback>
              {activeChatFriend.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">
              {activeChatFriend.display_name || activeChatFriend.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeChatFriend.tier && <TierBadge tier={activeChatFriend.tier as any} size="sm" />}
            </p>
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

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender_id === user.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      msg.sender_id === user.id
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{msg.message_text}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      msg.sender_id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
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
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No friends yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for users to add as friends
                </p>
                <Button onClick={() => setActiveTab('search')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
              </Card>
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
                      <p className="font-semibold truncate">
                        {friend.display_name || friend.username}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {friend.tier && <TierBadge tier={friend.tier as any} size="sm" />}
                        <span>{friend.total_points?.toLocaleString() || 0} pts</span>
                      </div>
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

            <div className="space-y-3">
              {searchResults.map(user => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {user.display_name || user.username}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {user.tier && <TierBadge tier={user.tier as any} size="sm" />}
                        <span>{user.total_points?.toLocaleString() || 0} pts</span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}

              {searchQuery && searchResults.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users found</p>
                  <p className="text-sm">Try a different search</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
