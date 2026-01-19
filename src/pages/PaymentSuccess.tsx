import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Crown, ArrowLeft } from 'lucide-react';
import { usePremium } from '@/contexts/PremiumContext';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPremiumStatus } = usePremium();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found');
      return;
    }

    if (!user) {
      // Wait for auth to load
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('failed');
          setMessage('Please log in to verify your payment');
          return;
        }

        const response = await supabase.functions.invoke('verify-payment', {
          body: { reference },
        });

        if (response.error) {
          console.error('Verify error:', response.error);
          setStatus('failed');
          setMessage(response.error.message || 'Failed to verify payment');
          return;
        }

        const data = response.data;

        if (data.verified && data.is_premium) {
          setStatus('success');
          setMessage('Payment successful! Premium activated.');
          setExpiresAt(data.premium_expires_at);
          // Refresh premium status in context
          await refreshPremiumStatus();
        } else if (data.verified === false) {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed');
        } else {
          setStatus('failed');
          setMessage('Payment could not be verified');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('An error occurred while verifying payment');
      }
    };

    verifyPayment();
  }, [reference, user, refreshPremiumStatus]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <h1 className="text-2xl font-bold">{message}</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="relative">
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-500" />
              <Crown className="w-8 h-8 absolute -top-2 -right-2 text-yellow-500 mx-auto left-1/2 transform -translate-x-1/2 ml-8" />
            </div>
            <h1 className="text-2xl font-bold text-green-600">Premium Activated!</h1>
            <p className="text-muted-foreground">{message}</p>
            {expiresAt && (
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Premium valid until</p>
                <p className="text-lg font-semibold text-primary">{formatDate(expiresAt)}</p>
              </div>
            )}
            <div className="space-y-3 pt-4">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/themes')} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Explore Premium Themes
              </Button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-20 h-20 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="space-y-3 pt-4">
              <Button onClick={() => navigate('/premium')} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}