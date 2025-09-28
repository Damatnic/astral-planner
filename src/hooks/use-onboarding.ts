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
  // Initialize with hydration-safe defaults
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    // Hydration effect - runs only on client after initial render
    setIsHydrated(true);
    
    // Check if onboarding is completed only on client
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding-completed');
      const data = localStorage.getItem('onboarding-data');
      
      setIsCompleted(completed === 'true');
      
      if (data) {
        try {
          setOnboardingData(JSON.parse(data));
        } catch (error) {
          console.warn('Failed to parse onboarding data:', error);
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
    isHydrated,
  };
}