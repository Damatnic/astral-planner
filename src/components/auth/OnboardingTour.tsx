'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Shield, 
  Star,
  Play,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Astral Chronos',
    description: 'Your intelligent digital planner that adapts to your workflow. Let\'s get you started with a quick tour.',
    icon: <Star className="w-6 h-6" />,
    highlight: true
  },
  {
    id: 'account-selection',
    title: 'Choose Your Workspace',
    description: 'Select between your personal account or try our demo experience with sample data.',
    icon: <User className="w-6 h-6" />,
    target: 'account-cards',
    position: 'bottom'
  },
  {
    id: 'demo-account',
    title: 'Try Demo Mode',
    description: 'The demo account comes with sample data and auto-fills the PIN for easy testing.',
    icon: <Play className="w-6 h-6" />,
    target: 'demo-account',
    position: 'right'
  },
  {
    id: 'secure-auth',
    title: 'Secure Authentication',
    description: 'We use PIN-based authentication to keep your data secure while maintaining quick access.',
    icon: <Shield className="w-6 h-6" />,
    target: 'pin-input',
    position: 'top'
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Now you\'re ready to experience the full power of Astral Chronos. Let\'s dive in!',
    icon: <CheckCircle className="w-6 h-6" />,
    highlight: true
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStep?: string;
}

export default function OnboardingTour({ 
  isOpen, 
  onClose, 
  onComplete, 
  currentStep = 'welcome' 
}: OnboardingTourProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Reset to first step when opening
      setActiveStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep && isOpen) {
      const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
      if (stepIndex !== -1) {
        setActiveStep(stepIndex);
      }
    }
  }, [currentStep, isOpen]);

  const currentStepData = ONBOARDING_STEPS[activeStep];
  const isLastStep = activeStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = activeStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
      onClose();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>

                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      key={activeStep}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="p-3 bg-white/20 rounded-xl"
                    >
                      {currentStepData.icon}
                    </motion.div>
                    <div>
                      <motion.h3
                        key={`title-${activeStep}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl font-bold"
                      >
                        {currentStepData.title}
                      </motion.h3>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        Step {activeStep + 1} of {ONBOARDING_STEPS.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-gray-700 text-base leading-relaxed mb-6">
                      {currentStepData.description}
                    </p>

                    {/* Special content for specific steps */}
                    {activeStep === 1 && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Account Types</span>
                        </div>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div className="flex justify-between">
                            <span>Personal Account:</span>
                            <span>Your private workspace</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Demo Account:</span>
                            <span>Try with sample data</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Play className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Demo Features</span>
                        </div>
                        <div className="space-y-1 text-sm text-green-800">
                          <div>• Instant access with PIN: 0000</div>
                          <div>• Pre-loaded sample tasks and events</div>
                          <div>• All features unlocked</div>
                          <div>• No registration required</div>
                        </div>
                      </div>
                    )}

                    {activeStep === 3 && (
                      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-900">Security Features</span>
                        </div>
                        <div className="space-y-1 text-sm text-purple-800">
                          <div>• 4-digit PIN authentication</div>
                          <div>• Local data encryption</div>
                          <div>• Session management</div>
                          <div>• Automatic logout after 24 hours</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <EnhancedButton
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isFirstStep}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                      className={isFirstStep ? 'opacity-50' : ''}
                    >
                      Previous
                    </EnhancedButton>

                    <div className="flex gap-2">
                      <EnhancedButton
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Skip Tour
                      </EnhancedButton>

                      <EnhancedButton
                        variant="gradient"
                        onClick={handleNext}
                        rightIcon={
                          isLastStep ? 
                            <CheckCircle className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                        }
                        animation="shimmer"
                      >
                        {isLastStep ? 'Get Started' : 'Next'}
                      </EnhancedButton>
                    </div>
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="px-6 pb-4">
                  <div className="flex justify-center gap-2">
                    {ONBOARDING_STEPS.map((_, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveStep(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === activeStep 
                            ? 'bg-blue-500 shadow-lg' 
                            : index < activeStep
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Highlight Target Elements */}
          {currentStepData.target && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40"
            >
              <div 
                className={`absolute bg-white/10 border-2 border-blue-400 rounded-lg shadow-2xl ${
                  currentStepData.target === 'account-cards' ? 'top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-80 h-64' :
                  currentStepData.target === 'demo-account' ? 'top-[45%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-72 h-32' :
                  currentStepData.target === 'pin-input' ? 'top-[55%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-64 h-16' :
                  ''
                }`}
              />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}