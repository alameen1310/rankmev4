import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Users, 
  MessageSquare, 
  Eye, 
  Trophy,
  RefreshCw,
  Send,
  Banknote,
  Clock,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
  Bell,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { calculateTier } from '@/lib/tierUtils';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  tier: string | null;
  total_points: number | null;
  weekly_points: number | null;
  accuracy: number | null;
  total_quizzes_completed: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_active_date: string | null;
  created_at: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDMDialog, setShowDMDialog] = useState(false);
  const [showEditRankDialog, setShowEditRankDialog] = useState(false);
  const [showResetLeaderboardDialog, setShowResetLeaderboardDialog] = useState(false);
  const [dmMessage, setDmMessage] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [sendingDM, setSendingDM] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.account_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleDMUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDmMessage('');
    setShowDMDialog(true);
  };

  const handleEditRank = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPoints(String(user.total_points || 0));
    setShowEditRankDialog(true);
  };

  const sendDirectMessage = async () => {
    if (!selectedUser || !dmMessage.trim() || !adminUser) return;
    
    setSendingDM(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: adminUser.id,
          receiver_id: selectedUser.id,
          message: dmMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: `DM sent to ${selectedUser.username || 'user'}`,
      });
      setShowDMDialog(false);
      setDmMessage('');
    } catch (error) {
      console.error('Error sending DM:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSendingDM(false);
    }
  };

  const updateUserPoints = async () => {
    if (!selectedUser || !newPoints) return;
    
    try {
      const points = parseInt(newPoints);
      if (isNaN(points) || points < 0) {
        toast({
          title: 'Invalid points',
          description: 'Please enter a valid number',
          variant: 'destructive',
        });
        return;
      }

      // Calculate new tier based on points
      const newTier = calculateTier(points);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          total_points: points,
          tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Points updated!',
        description: `${selectedUser.username}'s points set to ${points.toLocaleString()} (${newTier} tier)`,
      });
      setShowEditRankDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating points:', error);
      toast({
        title: 'Error',
        description: 'Failed to update points',
        variant: 'destructive',
      });
    }
  };

  const resetLeaderboard = async () => {
    try {
      // Reset all users' points and tier
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ 
          total_points: 0,
          weekly_points: 0,
          tier: 'bronze',
          updated_at: new Date().toISOString(),
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (profilesError) throw profilesError;

      // Reset leaderboard entries
      const { error: leaderboardError } = await supabase
        .from('leaderboard_entries')
        .update({ 
          points: 0,
          rank: null,
          updated_at: new Date().toISOString(),
        })
        .neq('id', 0); // Update all

      if (leaderboardError) throw leaderboardError;

      toast({
        title: 'Leaderboard reset!',
        description: 'All user points have been reset to 0',
      });
      setShowResetLeaderboardDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset leaderboard',
        variant: 'destructive',
      });
    }
  };

  const [sendingNotification, setSendingNotification] = useState(false);

  const sendBankDetailsNotification = async () => {
    setSendingNotification(true);
    try {
      // Get all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .is('account_number', null);

      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        toast({
          title: 'No users to notify',
          description: 'All users already have bank details',
        });
        setSendingNotification(false);
        return;
      }

      // Create notifications for all users without bank details
      const notifications = allUsers.map(user => ({
        user_id: user.id,
        type: 'system',
        title: '💰 Add Your Bank Details',
        message: 'Please update your bank account details in Settings to receive cash prizes! Go to Profile > Settings to add your bank name, account number, and account name.',
        read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      toast({
        title: 'Notifications sent!',
        description: `Sent bank details reminder to ${allUsers.length} users`,
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notifications',
        variant: 'destructive',
      });
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              View user details, send DMs, and manage rankings
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={sendBankDetailsNotification}
              disabled={sendingNotification}
            >
              {sendingNotification ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Notify Bank Details
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="destructive"
              onClick={() => setShowResetLeaderboardDialog(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Leaderboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.last_active_date === new Date().toISOString().split('T')[0]).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Bank Details</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.account_number && u.bank_name).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, display name, or account name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Click on actions to view details, send DM, or edit rank</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Quizzes</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar_url ? (
                                <AvatarImage src={user.avatar_url} alt={user.username || ''} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(user.username || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username || 'No username'}</p>
                              <p className="text-xs text-muted-foreground">{user.display_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.tier || 'bronze'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-warning" />
                            {(user.total_points || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{user.total_quizzes_completed || 0}</TableCell>
                        <TableCell>
                          {user.last_active_date 
                            ? format(new Date(user.last_active_date), 'MMM d, yyyy')
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {user.bank_name && user.account_number ? (
                            <Badge variant="secondary" className="text-xs">
                              <Banknote className="h-3 w-3 mr-1" />
                              Added
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewUser(user)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDMUser(user)}
                              title="Send DM"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditRank(user)}
                              title="Edit rank/points"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedUser?.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser?.username || ''} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedUser?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {selectedUser?.username || 'User Details'}
              </DialogTitle>
              <DialogDescription>
                Full user profile and activity details
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="font-medium">{selectedUser.username || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Display Name</Label>
                    <p className="font-medium">{selectedUser.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Country</Label>
                    <p className="font-medium">{selectedUser.country || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tier</Label>
                    <Badge variant="outline">{selectedUser.tier || 'bronze'}</Badge>
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Statistics
                  </h4>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{(selectedUser.total_points || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedUser.total_quizzes_completed || 0}</p>
                      <p className="text-xs text-muted-foreground">Quizzes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.round(selectedUser.accuracy || 0)}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedUser.current_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Current Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedUser.longest_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Longest Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{(selectedUser.weekly_points || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Weekly Points</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Bank Account Details
                  </h4>
                  {selectedUser.bank_name && selectedUser.account_number ? (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="font-medium">{selectedUser.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-medium">{selectedUser.account_name || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-medium font-mono">{selectedUser.account_number}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm p-4 bg-muted/50 rounded-lg">
                      No bank details provided
                    </p>
                  )}
                </div>

                {/* Activity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined
                    </Label>
                    <p className="font-medium">
                      {selectedUser.created_at 
                        ? format(new Date(selectedUser.created_at), 'MMM d, yyyy')
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Active
                    </Label>
                    <p className="font-medium">
                      {selectedUser.last_active_date 
                        ? format(new Date(selectedUser.last_active_date), 'MMM d, yyyy')
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
              <Button onClick={() => { setShowUserDetails(false); handleDMUser(selectedUser!); }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send DM
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send DM Dialog */}
        <Dialog open={showDMDialog} onOpenChange={setShowDMDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Direct Message
              </DialogTitle>
              <DialogDescription>
                Send a message to {selectedUser?.username || 'this user'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  {selectedUser?.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser?.username || ''} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedUser?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser?.display_name}</p>
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message..."
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDMDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendDirectMessage} disabled={!dmMessage.trim() || sendingDM}>
                <Send className="h-4 w-4 mr-2" />
                {sendingDM ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rank Dialog */}
        <Dialog open={showEditRankDialog} onOpenChange={setShowEditRankDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit User Points
              </DialogTitle>
              <DialogDescription>
                Update points for {selectedUser?.username || 'this user'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedUser?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Current: {(selectedUser?.total_points || 0).toLocaleString()} points
                  </p>
                </div>
              </div>
              <div>
                <Label>New Points Value</Label>
                <Input
                  type="number"
                  placeholder="Enter new points"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditRankDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateUserPoints}>
                <Trophy className="h-4 w-4 mr-2" />
                Update Points
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Leaderboard Confirmation Dialog */}
        <Dialog open={showResetLeaderboardDialog} onOpenChange={setShowResetLeaderboardDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Reset Entire Leaderboard?
              </DialogTitle>
              <DialogDescription>
                This action will reset ALL users' points to 0. This cannot be undone!
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-destructive/10 rounded-lg text-sm">
              <p className="font-medium text-destructive mb-2">Warning:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All user total points will be set to 0</li>
                <li>All weekly points will be reset</li>
                <li>Leaderboard rankings will be cleared</li>
                <li>This action is irreversible</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetLeaderboardDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={resetLeaderboard}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yes, Reset Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
