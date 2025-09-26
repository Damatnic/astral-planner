import { useState, useEffect } from 'react';

interface OnboardingData {
  firstName: string;
  lastName: string;
  role: string;
  goals: string[];
  categories: string[];
  planningStyle: string;
  enabledFeatures: string[];
  onboardingCompleted: boolean;
  onboardingCompletedAt: string;
}

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isClient, setIsClient] = useState<boolean | null>(null);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
    
    // Check if onboarding is completed
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding-completed');
      const data = localStorage.getItem('onboarding-data');
      
      setIsCompleted(completed === 'true');
      
      if (data) {
        try {
          setOnboardingData(JSON.parse(data));
        } catch (error) {
          console.error('Failed to parse onboarding data:', error);
        }
      }
    }
  }, []);

  const completeOnboarding = (data: OnboardingData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-completed', 'true');
      localStorage.setItem('onboarding-data', JSON.stringify(data));
    }
    setIsCompleted(true);
    setOnboardingData(data);
  };

  const resetOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding-completed');
      localStorage.removeItem('onboarding-data');
    }
    setIsCompleted(false);
    setOnboardingData(null);
  };

  return {
    isCompleted,
    onboardingData,
    completeOnboarding,
    resetOnboarding,
    isClient,
  };
}