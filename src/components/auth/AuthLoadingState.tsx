'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  CheckCircle,
  Settings,
  Database,
  Key,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export interface AuthLoadingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  progress: number;
}

interface AuthLoadingStateProps {
  isLoading: boolean;
  steps?: AuthLoadingStep[];
  currentStep?: number;
  progress?: number;
  message?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
  showSteps?: boolean;
  onComplete?: () => void;
}

const DEFAULT_STEPS: AuthLoadingStep[] = [
  {
    id: 'validating',
    label: 'Validating Credentials',
    description: 'Verifying your PIN and account details',
    icon: <Key className="w-5 h-5" />,
    duration: 1000,
    progress: 25
  },
  {
    id: 'securing',
    label: 'Securing Session',
    description: 'Establishing encrypted connection',
    icon: <Shield className="w-5 h-5" />,
    duration: 800,
    progress: 50
  },
  {
    id: 'loading-data',
    label: 'Loading Workspace',
    description: 'Preparing your personalized environment',
    icon: <Database className="w-5 h-5" />,
    duration: 1200,
    progress: 75
  },
  {
    id: 'finalizing',
    label: 'Finalizing Setup',
    description: 'Almost ready to go!',
    icon: <Settings className="w-5 h-5" />,
    duration: 600,
    progress: 95
  }
];

export default function AuthLoadingState({
  isLoading,
  steps = DEFAULT_STEPS,
  currentStep = 0,
  progress = 0,
  message,
  variant = 'detailed',
  showSteps = true,
  onComplete
}: AuthLoadingStateProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [internalStep, setInternalStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoading) {
      setInternalProgress(0);
      setInternalStep(0);
      setCompletedSteps(new Set());
      return;
    }

    // Auto-progress through steps if not controlled externally
    if (progress === 0 && currentStep === 0) {
      let stepIndex = 0;
      let currentProgress = 0;

      const progressStep = () => {
        if (stepIndex < steps.length) {
          const step = steps[stepIndex];
          
          // Mark previous step as completed
          if (stepIndex > 0) {
            setCompletedSteps(prev => new Set([...Array.from(prev), stepIndex - 1]));
          }
          
          setInternalStep(stepIndex);
          
          // Animate progress for current step
          const startProgress = stepIndex === 0 ? 0 : steps[stepIndex - 1].progress;
          const endProgress = step.progress;
          const duration = step.duration;
          const increment = (endProgress - startProgress) / (duration / 50);
          
          const progressInterval = setInterval(() => {
            currentProgress += increment;
            setInternalProgress(Math.min(currentProgress, endProgress));
            
            if (currentProgress >= endProgress) {
              clearInterval(progressInterval);
              stepIndex++;
              setTimeout(progressStep, 200);
            }
          }, 50);
        } else {
          // All steps completed
          setInternalProgress(100);
          setCompletedSteps(prev => new Set([...Array.from(prev), steps.length - 1]));
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      };

      progressStep();
    } else {
      setInternalProgress(progress);
      setInternalStep(currentStep);
    }
  }, [isLoading, progress, currentStep, steps, onComplete]);

  const displayProgress = progress || internalProgress;
  const displayStep = currentStep || internalStep;
  const currentStepData = steps[displayStep];

  if (!isLoading) return null;

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center p-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="text-sm text-gray-600">
            {message || 'Signing in...'}
          </span>
        </div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full max-w-sm mx-auto p-4"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <motion.div
              key={displayStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="p-2 bg-blue-100 rounded-lg text-blue-600"
            >
              {currentStepData?.icon || <Shield className="w-5 h-5" />}
            </motion.div>
            <div className="flex-1">
              <motion.h4
                key={`title-${displayStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-medium text-gray-900"
              >
                {currentStepData?.label || 'Processing...'}
              </motion.h4>
              <motion.p
                key={`desc-${displayStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-600"
              >
                {message || currentStepData?.description || 'Please wait...'}
              </motion.p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{Math.round(displayProgress)}%</span>
            </div>
            <Progress value={displayProgress} className="h-2" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Signing You In
              </h3>
              
              <p className="text-gray-600">
                Setting up your secure workspace
              </p>
            </div>

            {/* Current Step */}
            <div className="relative">
              <motion.div
                key={displayStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  className="p-3 bg-white rounded-xl shadow-sm text-blue-600"
                >
                  {currentStepData?.icon || <Shield className="w-6 h-6" />}
                </motion.div>
                
                <div className="flex-1">
                  <motion.h4
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-semibold text-gray-900"
                  >
                    {currentStepData?.label || 'Processing...'}
                  </motion.h4>
                  
                  <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-gray-600"
                  >
                    {message || currentStepData?.description || 'Please wait...'}
                  </motion.p>
                </div>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full"
                />
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(displayProgress)}%
                </span>
              </div>
              
              <div className="relative">
                <Progress value={displayProgress} className="h-3" />
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  style={{ 
                    left: `${displayProgress}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            {showSteps && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">
                  Authentication Steps
                </h5>
                
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                        completedSteps.has(index)
                          ? 'bg-green-50 text-green-700'
                          : index === displayStep
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        completedSteps.has(index)
                          ? 'bg-green-200'
                          : index === displayStep
                          ? 'bg-blue-200'
                          : 'bg-gray-200'
                      }`}>
                        {completedSteps.has(index) ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            {step.icon}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-sm font-medium flex-1">
                        {step.label}
                      </span>
                      
                      {index === displayStep && !completedSteps.has(index) && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border border-current border-t-transparent rounded-full"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg"
            >
              <Shield className="w-4 h-4" />
              <span>Secured with end-to-end encryption</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-3 h-3 text-green-500" />
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}