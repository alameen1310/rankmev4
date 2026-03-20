import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Landing } from './Landing';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const hasOnboarded = localStorage.getItem('rankme_onboarded');
      if (!hasOnboarded) {
        setShowOnboarding(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('rankme_onboarded', 'true');
    setShowOnboarding(false);
    navigate('/dashboard');
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <Landing />;
};

export default Index;
