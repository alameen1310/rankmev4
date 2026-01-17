import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CreditCard, Building, User, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  useEffect(() => {
    if (user) {
      fetchBankDetails();
    }
  }, [user]);

  const fetchBankDetails = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
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
      
      toast.success('Bank details saved successfully!');
      setIsSaved(true);
      await refreshProfile();
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Bank Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Add your bank account details to receive cash prizes
            </CardDescription>
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
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Number
              </Label>
              <Input
                id="account_number"
                placeholder="Enter your account number"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
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
                placeholder="Name on your bank account"
                value={bankDetails.account_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Bank Details
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Why do we need this?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your bank details are required to receive cash prizes from competitions and events. 
                  This information is securely stored and only accessible by administrators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
