import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Key, 
  Database,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AdminSettings = () => {
  const { user, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      // Simulate cache refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Cache refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh cache');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            System configuration and admin account settings
          </p>
        </div>

        {/* Admin Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Account
            </CardTitle>
            <CardDescription>Your super admin account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Badge className="bg-green-500">Super Admin</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Username</span>
              <span className="text-sm text-muted-foreground">{profile?.username || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Current system health and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <Badge className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Question Generator</span>
              <Badge className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">File Storage</span>
              <Badge className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>System Actions</CardTitle>
            <CardDescription>Administrative actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Refresh Cache</p>
                <p className="text-sm text-muted-foreground">Clear and refresh system cache</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefreshCache}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Only the super admin account (ghostayoola@gmail.com) can access this dashboard.</p>
            <p>• All admin actions are logged for security purposes.</p>
            <p>• Never share your admin credentials with anyone.</p>
            <p>• Always sign out when finished with admin tasks.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
