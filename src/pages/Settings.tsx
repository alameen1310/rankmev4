import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CreditCard, Building, User, Loader2, CheckCircle, Volume2, VolumeX, Bell, MessageSquare, Users, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { soundEngine } from '@/lib/sounds';
import { toast } from 'sonner';

const NOTIFICATION_PREFS_KEY = 'rankme_notification_prefs';

interface NotificationPrefs {
  friend_requests: boolean;
  chat: boolean;
  battle_updates: boolean;
  system: boolean;
}

const defaultPrefs: NotificationPrefs = {
  friend_requests: true,
  chat: true,
  battle_updates: true,
  system: true,
};

function loadNotificationPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
  } catch { return defaultPrefs; }
}

function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

export const Settings = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [bankDetails, setBankDetails] = useState({ bank_name: '', account_number: '', account_name: '' });

  useEffect(() => {
    setSoundEnabled(soundEngine.isEnabled());
    setNotifPrefs(loadNotificationPrefs());
    if (user) fetchBankDetails();
  }, [user?.id]);

  const fetchBankDetails = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('bank_name, account_number, account_name').eq('id', user.id).maybeSingle();
    if (data) {
      setBankDetails({
        bank_name: data.bank_name || '',
        account_number: data.account_number || '',
        account_name: data.account_name || '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        bank_name: bankDetails.bank_name || null,
        account_number: bankDetails.account_number || null,
        account_name: bankDetails.account_name || null,
      }).eq('id', user.id);
      if (error) throw error;
      toast.success('Settings saved!');
      setIsSaved(true);
      await refreshProfile();
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundEngine.setEnabled(enabled);
    if (enabled) soundEngine.playTap();
  };

  const handleToggleNotifPref = (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center max-w-sm">
          <h2 className="text-lg font-bold mb-2">Login Required</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign in to access settings</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const notifOptions = [
    { key: 'friend_requests' as const, label: 'Friend Requests', icon: Users },
    { key: 'chat' as const, label: 'Chat Messages', icon: MessageSquare },
    { key: 'battle_updates' as const, label: 'Battle Updates', icon: Swords },
    { key: 'system' as const, label: 'System Alerts', icon: Bell },
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-background sticky top-14 z-40 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Sound */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">Game Sounds</p>
                  <p className="text-xs text-muted-foreground">Gameplay sound effects</p>
                </div>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={handleToggleSound} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifOptions.map(opt => (
              <div key={opt.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <opt.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{opt.label}</span>
                </div>
                <Switch checked={notifPrefs[opt.key]} onCheckedChange={(v) => handleToggleNotifPref(opt.key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Bank Details
            </CardTitle>
            <CardDescription className="text-xs">For cash prize payouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name" className="text-xs">Bank Name</Label>
              <Input id="bank_name" placeholder="e.g., First Bank" value={bankDetails.bank_name} onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="account_number" className="text-xs">Account Number</Label>
                <Input id="account_number" placeholder="0000000000" value={bankDetails.account_number} onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))} maxLength={15} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account_name" className="text-xs">Account Name</Label>
                <Input id="account_name" placeholder="Name on account" value={bankDetails.account_name} onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="w-full" size="sm">
              {isLoading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</> :
               isSaved ? <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Saved!</> :
               <><Save className="h-3.5 w-3.5 mr-1.5" /> Save</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
