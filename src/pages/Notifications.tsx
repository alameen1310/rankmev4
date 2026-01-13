import { useState } from 'react';
import { 
  Bell, MessageSquare, Users, Swords, Trophy, Gift, Settings, 
  Trash2, Check, CheckCheck, ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameState } from '@/contexts/GameStateContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_ICONS = {
  chat: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  friend_request: { icon: Users, color: 'text-success', bg: 'bg-success/10' },
  battle_invite: { icon: Swords, color: 'text-destructive', bg: 'bg-destructive/10' },
  achievement: { icon: Trophy, color: 'text-warning', bg: 'bg-warning/10' },
  reward: { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  system: { icon: Settings, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export const Notifications = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications 
  } = useGameState();
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.read;
    return notif.type === activeTab;
  });

  const handleNotificationClick = (id: string, type: string, data?: Record<string, unknown>) => {
    markNotificationRead(id);
    
    // Navigate based on notification type
    if (type === 'chat' && data?.chatId) {
      navigate(`/friends?chat=${data.chatId}`);
    } else if (type === 'friend_request') {
      navigate('/friends');
    } else if (type === 'battle_invite' && data?.battleId) {
      navigate(`/battle/${data.battleId}`);
    } else if (type === 'achievement' || type === 'reward') {
      navigate('/gamification');
    }
  };

  return (
    <div className="min-h-screen pb-safe-bottom">
      {/* Header */}
      <section className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllNotificationsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4">
        <div className="max-w-lg mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full mb-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs relative">
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">💬</TabsTrigger>
              <TabsTrigger value="friend_request" className="text-xs">👥</TabsTrigger>
              <TabsTrigger value="achievement" className="text-xs">🏆</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-2">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(notification => {
                    const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
                    const Icon = config.icon;
                    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id, notification.type, notification.data)}
                        className={cn(
                          "glass rounded-xl p-4 cursor-pointer transition-all",
                          "hover:bg-accent/50 active:scale-[0.99]",
                          !notification.read && "ring-2 ring-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bg)}>
                            <Icon className={cn("h-5 w-5", config.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={cn(
                                "font-medium text-sm",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {timeAgo}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {/* Action buttons for certain types */}
                            {notification.type === 'friend_request' && !notification.read && (
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="h-7 text-xs">Accept</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs">Decline</Button>
                              </div>
                            )}
                            {notification.type === 'battle_invite' && !notification.read && (
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="h-7 text-xs bg-destructive hover:bg-destructive/90">
                                  Accept Battle
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs">Later</Button>
                              </div>
                            )}
                          </div>
                          
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="glass rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">No notifications</h3>
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Notification Settings Link */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Notification Preferences</h4>
                <p className="text-xs text-muted-foreground">Manage what notifications you receive</p>
              </div>
              <Button variant="ghost" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
