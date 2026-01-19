import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Crown, 
  Check, 
  Sparkles, 
  Palette, 
  Brain, 
  BarChart3, 
  Zap, 
  Shield,
  ArrowLeft,
  Loader2,
  CreditCard,
  Building2
} from 'lucide-react';

const PREMIUM_FEATURES = [
  { icon: Palette, title: 'Premium Themes', description: 'Access all exclusive themes and customizations' },
  { icon: Brain, title: 'AI Study Tools', description: 'Smart study recommendations and insights' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'Detailed performance breakdowns and trends' },
  { icon: Zap, title: 'Priority Matchmaking', description: 'Faster PvP matching with similar skill levels' },
  { icon: Shield, title: 'Ad-Free Experience', description: 'No interruptions while learning' },
  { icon: Sparkles, title: 'Profile Customization', description: 'Unique badges and profile decorations' },
];

export function Premium() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isPremium, premiumExpiresAt, daysRemaining, isLoading: premiumLoading } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('initialize-payment', {});

      if (response.error) {
        console.error('Payment init error:', response.error);
        toast.error(response.error.message || 'Failed to initialize payment');
        setIsProcessing(false);
        return;
      }

      const data = response.data;

      if (data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        toast.error('Failed to get payment URL');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (premiumLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Premium</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero */}
        <Card className="p-6 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-red-500/20 border-yellow-500/30">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">RankMe Premium</h2>
            <p className="text-muted-foreground">
              Unlock all features and accelerate your learning journey
            </p>
          </div>
        </Card>

        {/* Current Status */}
        {isPremium && premiumExpiresAt && (
          <Card className="p-4 bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-600">Premium Active</p>
                <p className="text-sm text-muted-foreground">
                  {daysRemaining} days remaining • Expires {formatDate(premiumExpiresAt)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Premium Features</h3>
          <div className="grid gap-3">
            {PREMIUM_FEATURES.map((feature, index) => (
              <Card key={index} className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="w-5 h-5 text-green-500 shrink-0 ml-auto" />
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Monthly Subscription</p>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-4xl font-bold">₦2,000</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>Bank Transfer</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📱</span>
              <span>USSD</span>
            </div>
          </div>

          <Button 
            onClick={handleSubscribe} 
            disabled={isProcessing}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : isPremium ? (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Extend Subscription
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Subscribe Now
              </>
            )}
          </Button>

          {isPremium && (
            <p className="text-center text-sm text-muted-foreground">
              Your current subscription will be extended by 30 days
            </p>
          )}
        </Card>

        {/* Security Note */}
        <div className="text-center text-sm text-muted-foreground">
          <Shield className="w-4 h-4 inline-block mr-1" />
          Secure payment powered by Paystack
        </div>
      </div>
    </div>
  );
}