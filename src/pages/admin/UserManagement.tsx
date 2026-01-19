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
  AlertTriangle,
  Bell,
  Loader2,
  Shield,
  Megaphone,
  Plus,
  Minus,
  Trash2
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
  is_admin: boolean | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDMDialog, setShowDMDialog] = useState(false);
  const [showEditPointsDialog, setShowEditPointsDialog] = useState(false);
  const [showResetLeaderboardDialog, setShowResetLeaderboardDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showMakeAdminDialog, setShowMakeAdminDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [dmMessage, setDmMessage] = useState('');
  const [pointsChange, setPointsChange] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [isAddingPoints, setIsAddingPoints] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState('');
  const [sendingDM, setSendingDM] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
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

  const handleEditPoints = (user: UserProfile) => {
    setSelectedUser(user);
    setPointsChange('');
    setPointsReason('');
    setIsAddingPoints(true);
    setShowEditPointsDialog(true);
  };

  const handleMakeAdmin = (user: UserProfile) => {
    setSelectedUser(user);
    setShowMakeAdminDialog(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteConfirmUsername('');
    setShowDeleteUserDialog(true);
  };

  // Admin DM - bypasses friend requirements and creates friendship for visibility
  const sendDirectMessage = async () => {
    if (!selectedUser || !dmMessage.trim() || !adminUser) return;
    
    setSendingDM(true);
    try {
      // Create bidirectional friendship so admin appears in user's Friends tab
      // Use upsert to avoid duplicates
      await supabase
        .from('friendships')
        .upsert([
          { user_id: adminUser.id, friend_id: selectedUser.id },
          { user_id: selectedUser.id, friend_id: adminUser.id },
        ], { onConflict: 'user_id,friend_id', ignoreDuplicates: true });

      // Insert the message directly - admin bypasses friend requirements
      const { error: msgError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: adminUser.id,
          receiver_id: selectedUser.id,
          message: `[RankMe Admin] ${dmMessage.trim()}`,
          message_type: 'text',
        });

      if (msgError) throw msgError;

      // Create a notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: 'admin_message',
          title: '📩 New Message from RankMe Admin',
          message: dmMessage.trim().slice(0, 100) + (dmMessage.length > 100 ? '...' : ''),
          data: { from_admin: true },
        });

      // Log the admin action
      await logAdminAction('admin_dm', selectedUser.id, { message_preview: dmMessage.slice(0, 50) });

      toast({
        title: 'Message sent!',
        description: `Admin DM sent to ${selectedUser.username || 'user'}. You now appear in their Friends list.`,
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

  // Update user points via backend function
  const updateUserPoints = async () => {
    if (!selectedUser || !pointsChange || !adminUser) return;
    
    setProcessingAction(true);
    try {
      const changeAmount = parseInt(pointsChange);
      if (isNaN(changeAmount) || changeAmount < 0) {
        toast({
          title: 'Invalid points',
          description: 'Please enter a valid positive number',
          variant: 'destructive',
        });
        setProcessingAction(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('adjust-points', {
        body: {
          user_id: selectedUser.id,
          points_change: changeAmount,
          is_adding: isAddingPoints,
          reason: pointsReason || 'No reason provided',
        },
      });

      if (error) throw error;

      toast({
        title: '✅ Points updated!',
        description: data?.message || `Points ${isAddingPoints ? 'added' : 'removed'} successfully`,
      });
      setShowEditPointsDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating points:', error);
      toast({
        title: 'Error',
        description: `Failed to update points: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Reset entire leaderboard (server-side to bypass RLS)
  const resetLeaderboard = async () => {
    if (!adminUser) return;

    setProcessingAction(true);
    try {
      console.log('Starting leaderboard reset (backend function)...');

      const { data, error } = await supabase.functions.invoke('reset-leaderboard', {
        body: {},
      });

      if (error) {
        console.error('reset-leaderboard invoke error:', error);
        throw error;
      }

      console.log('reset-leaderboard response:', data);

      toast({
        title: '✅ Leaderboard reset!',
        description: `Reset ${(data as any)?.profiles_reset ?? 'all'} users to 0 points`,
      });

      setShowResetLeaderboardDialog(false);
      await loadUsers();
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      toast({
        title: 'Error',
        description: `Failed to reset leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Send broadcast notification to all users
  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim() || !adminUser) return;
    
    setProcessingAction(true);
    try {
      // Get all user IDs
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        toast({
          title: 'No users to notify',
          description: 'There are no users in the system',
        });
        return;
      }

      // Create notifications for all users
      const notifications = allUsers.map(user => ({
        user_id: user.id,
        type: 'announcement',
        title: `📢 ${broadcastTitle.trim()}`,
        message: broadcastMessage.trim(),
        read: false,
        data: { is_broadcast: true, from_admin: true },
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      // Log the admin action
      await logAdminAction('broadcast', null, {
        title: broadcastTitle,
        message_preview: broadcastMessage.slice(0, 100),
        recipients_count: allUsers.length,
      });

      toast({
        title: 'Broadcast sent!',
        description: `Notification sent to ${allUsers.length} users`,
      });
      setShowBroadcastDialog(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send broadcast',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Make/remove user as admin via backend function
  const makeUserAdmin = async () => {
    if (!selectedUser || !adminUser) return;
    
    setProcessingAction(true);
    try {
      const newAdminStatus = !selectedUser.is_admin;
      
      const { data, error } = await supabase.functions.invoke('toggle-admin', {
        body: {
          user_id: selectedUser.id,
          make_admin: newAdminStatus,
        },
      });

      if (error) throw error;

      toast({
        title: newAdminStatus ? '🛡️ Admin created!' : '🛡️ Admin removed!',
        description: data?.message || `${selectedUser.username} is ${newAdminStatus ? 'now' : 'no longer'} an admin`,
      });
      setShowMakeAdminDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Error',
        description: `Failed to update admin status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Delete user entirely via backend function
  const deleteUser = async () => {
    if (!selectedUser || !adminUser) return;
    
    // Safety check: username must match
    if (deleteConfirmUsername !== selectedUser.username) {
      toast({
        title: 'Username mismatch',
        description: 'Please type the exact username to confirm deletion',
        variant: 'destructive',
      });
      return;
    }

    setProcessingAction(true);
    try {
      console.log('Deleting user via backend function...', selectedUser.id);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { 
          user_id: selectedUser.id,
          confirm_username: deleteConfirmUsername,
        },
      });

      if (error) {
        console.error('delete-user invoke error:', error);
        throw error;
      }

      console.log('delete-user response:', data);

      toast({
        title: '🗑️ User deleted',
        description: data?.message || `User ${selectedUser.username} has been permanently deleted`,
      });

      setShowDeleteUserDialog(false);
      setDeleteConfirmUsername('');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Log admin action for audit trail
  const logAdminAction = async (
    actionType: string, 
    targetUserId: string | null, 
    details: Record<string, unknown>
  ) => {
    if (!adminUser) return;
    
    try {
      await supabase
        .from('admin_actions')
        .insert([{
          admin_id: adminUser.id,
          action_type: actionType,
          target_user_id: targetUserId,
          details: details as unknown,
        }] as never);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const [sendingNotification, setSendingNotification] = useState(false);

  const sendBankDetailsNotification = async () => {
    setSendingNotification(true);
    try {
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
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">
              View users, send DMs, manage points & admins
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBroadcastDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <Megaphone className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Send Broadcast</span>
            <span className="sm:hidden">Broadcast</span>
          </Button>
          <Button
            variant="secondary"
            onClick={sendBankDetailsNotification}
            disabled={sendingNotification}
            className="flex-1 sm:flex-none"
          >
            {sendingNotification ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Notify Bank Details</span>
            <span className="sm:hidden">Bank Notify</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowResetLeaderboardDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reset Leaderboard</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {users.filter(u => u.last_active_date === new Date().toISOString().split('T')[0]).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Bank Details</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {users.filter(u => u.account_number && u.bank_name).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {users.filter(u => u.is_admin).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Search Users</CardTitle>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Click actions to view, DM, edit points, or manage admin</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">User</TableHead>
                    <TableHead className="hidden sm:table-cell">Tier</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                    <TableHead className="hidden md:table-cell">Admin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar_url ? (
                                <AvatarImage src={user.avatar_url} alt={user.username || ''} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(user.username || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{user.username || 'No username'}</p>
                              <p className="text-xs text-muted-foreground truncate hidden sm:block">{user.display_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{calculateTier(user.total_points || 0)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Trophy className="h-3 w-3 text-warning" />
                            {(user.total_points || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {user.last_active_date 
                            ? format(new Date(user.last_active_date), 'MMM d')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.is_admin ? (
                            <Badge variant="default" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">User</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewUser(user)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDMUser(user)}
                              title="Send admin DM"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditPoints(user)}
                              title="Edit points"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 hidden sm:flex"
                              onClick={() => handleMakeAdmin(user)}
                              title={user.is_admin ? "Remove admin" : "Make admin"}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
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
                <div>
                  {selectedUser?.username || 'User Details'}
                  {selectedUser?.is_admin && (
                    <Badge variant="default" className="ml-2 text-xs">Admin</Badge>
                  )}
                </div>
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
                    <Badge variant="outline">{calculateTier(selectedUser.total_points || 0)}</Badge>
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
              <Button onClick={() => { setShowUserDetails(false); handleDMUser(selectedUser!); }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send DM
              </Button>
              <Button variant="secondary" onClick={() => { setShowUserDetails(false); handleMakeAdmin(selectedUser!); }}>
                <Shield className="h-4 w-4 mr-2" />
                {selectedUser?.is_admin ? 'Remove Admin' : 'Make Admin'}
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
                Send Admin Direct Message
              </DialogTitle>
              <DialogDescription>
                This message bypasses friend requirements. User will be notified.
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
                  placeholder="Type your admin message..."
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Message will be prefixed with "[RankMe Admin]"
                </p>
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

        {/* Edit Points Dialog */}
        <Dialog open={showEditPointsDialog} onOpenChange={setShowEditPointsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit User Points
              </DialogTitle>
              <DialogDescription>
                Add or subtract points for {selectedUser?.username || 'this user'}
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
                    Current: {(selectedUser?.total_points || 0).toLocaleString()} points ({calculateTier(selectedUser?.total_points || 0)})
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={isAddingPoints ? "default" : "outline"}
                  onClick={() => setIsAddingPoints(true)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Points
                </Button>
                <Button
                  variant={!isAddingPoints ? "destructive" : "outline"}
                  onClick={() => setIsAddingPoints(false)}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Subtract Points
                </Button>
              </div>
              
              <div>
                <Label>Points Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter points amount"
                  value={pointsChange}
                  onChange={(e) => setPointsChange(e.target.value)}
                  min="0"
                />
              </div>
              
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Why are you changing this user's points?"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  rows={2}
                />
              </div>

              {pointsChange && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p>
                    New total: <strong>
                      {(isAddingPoints 
                        ? (selectedUser?.total_points || 0) + parseInt(pointsChange || '0')
                        : Math.max(0, (selectedUser?.total_points || 0) - parseInt(pointsChange || '0'))
                      ).toLocaleString()}
                    </strong> points
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditPointsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateUserPoints} 
                disabled={!pointsChange || processingAction}
                variant={isAddingPoints ? "default" : "destructive"}
              >
                {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />}
                {isAddingPoints ? 'Add' : 'Subtract'} Points
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
                <li>All tiers will be reset to Bronze</li>
                <li>Leaderboard rankings will be cleared</li>
                <li>This affects {users.length} users</li>
                <li>This action is logged and irreversible</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetLeaderboardDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={resetLeaderboard} disabled={processingAction}>
                {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Yes, Reset Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Broadcast Dialog */}
        <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Send Broadcast to All Users
              </DialogTitle>
              <DialogDescription>
                This notification will be sent to all {users.length} users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="e.g., New Feature Available!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Write your announcement..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendBroadcast} 
                disabled={!broadcastTitle.trim() || !broadcastMessage.trim() || processingAction}
              >
                {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send to All Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Make Admin Dialog */}
        <Dialog open={showMakeAdminDialog} onOpenChange={setShowMakeAdminDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {selectedUser?.is_admin ? 'Remove Admin Access' : 'Grant Admin Access'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.is_admin 
                  ? `Remove admin privileges from ${selectedUser?.username}?`
                  : `Make ${selectedUser?.username} an admin?`
                }
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
              
              <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                {selectedUser?.is_admin ? (
                  <p className="text-muted-foreground">
                    This user will lose access to the admin dashboard and all admin features.
                  </p>
                ) : (
                  <>
                    <p className="font-medium">Admin privileges include:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Access to admin dashboard</li>
                      <li>View all user details</li>
                      <li>Send admin DMs to any user</li>
                      <li>Edit user points</li>
                      <li>Reset leaderboard</li>
                      <li>Send broadcast notifications</li>
                      <li>Manage other admins</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMakeAdminDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={makeUserAdmin} 
                disabled={processingAction}
                variant={selectedUser?.is_admin ? "destructive" : "default"}
              >
                {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                {selectedUser?.is_admin ? 'Remove Admin' : 'Make Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete User Permanently
              </DialogTitle>
              <DialogDescription>
                This will permanently delete {selectedUser?.username} and ALL their data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                <Avatar className="h-10 w-10">
                  {selectedUser?.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser?.username || ''} />
                  ) : null}
                  <AvatarFallback className="bg-destructive/20 text-destructive">
                    {(selectedUser?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedUser?.total_points || 0).toLocaleString()} points • {selectedUser?.total_quizzes_completed || 0} quizzes
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm space-y-2">
                <p className="font-medium text-destructive">⚠️ This will delete:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                  <li>User account & profile</li>
                  <li>All quiz results & progress</li>
                  <li>All messages & friendships</li>
                  <li>All battle history</li>
                  <li>All badges & achievements</li>
                  <li>Leaderboard entries</li>
                </ul>
              </div>

              <div>
                <Label className="text-destructive">Type username to confirm: <strong>{selectedUser?.username}</strong></Label>
                <Input
                  placeholder="Type username here..."
                  value={deleteConfirmUsername}
                  onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={deleteUser} 
                disabled={processingAction || deleteConfirmUsername !== selectedUser?.username}
              >
                {processingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete User Forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;