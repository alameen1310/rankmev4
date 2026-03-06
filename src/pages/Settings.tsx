import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CreditCard, Building, User, Loader2, CheckCircle, Volume2, VolumeX, Bell, MessageSquare, Users, Swords, Settings as SettingsIcon } from 'lucide-react';
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
  } catch {
    return defaultPrefs;
  }
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

  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  useEffect(() => {
    setSoundEnabled(soundEngine.isEnabled());
    setNotifPrefs(loadNotificationPrefs());
    if (user) {
      fetchBankDetails();
    }
  }, [user?.id]);

  const fetchBankDetails = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('bank_name, account_number, account_name')
      .eq('id', user.id)
      .maybeSingle();

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
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankDetails.bank_name || null,
          account_number: bankDetails.account_number || null,
          account_name: bankDetails.account_name || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Settings saved successfully!');
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
    if (enabled) {
      soundEngine.playTap();
    }
  };

  const handleToggleNotifPref = (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    toast.success(`${key.replace('_', ' ')} notifications ${value ? 'enabled' : 'muted'}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access settings</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const notifOptions = [
    { key: 'friend_requests' as const, label: 'Friend Requests', desc: 'New friend request alerts', icon: Users },
    { key: 'chat' as const, label: 'Chat Messages', desc: 'New message notifications', icon: MessageSquare },
    { key: 'battle_updates' as const, label: 'Battle Updates', desc: 'PvP match & rank changes', icon: Swords },
    { key: 'system' as const, label: 'System Alerts', desc: 'Rewards, badges & announcements', icon: Bell },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 glass-strong border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Bank Details
              </CardTitle>
              <CardDescription>Add your bank account details to receive cash prizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Bank Name
                </Label>
                <Input
                  id="bank_name"
                  placeholder="e.g., First Bank, GTBank, Access Bank"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails((prev) => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Account Number
                  </Label>
                  <Input
                    id="account_number"
                    placeholder="Enter account number"
                    value={bankDetails.account_number}
                    onChange={(e) => setBankDetails((prev) => ({ ...prev, account_number: e.target.value }))}
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account Name
                  </Label>
                  <Input
                    id="account_name"
                    placeholder="Name on account"
                    value={bankDetails.account_name}
                    onChange={(e) => setBankDetails((prev) => ({ ...prev, account_name: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isLoading} className="w-full mt-2">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : isSaved ? (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Saved!</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Settings</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <div key={opt.key} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifPrefs[opt.key]}
                      onCheckedChange={(v) => handleToggleNotifPref(opt.key, v)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sound Effects</CardTitle>
              <CardDescription>Control gameplay sound feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Game Sounds</p>
                    <p className="text-xs text-muted-foreground">
                      Correct/wrong, streak, match found, victory
                    </p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleToggleSound} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Your bank details are securely stored and used only for prize payouts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
