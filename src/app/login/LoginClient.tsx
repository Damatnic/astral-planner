'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  LogIn, 
  Sparkles, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Star,
  Zap,
  Heart,
  Crown,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface Account {
  id: string;
  name: string;
  pin: string;
  displayName: string;
  avatar?: string;
  theme: string;
  createdAt: string;
  description?: string;
  features?: string[];
  lastLogin?: string | null;
  isDemoAccount?: boolean;
}

const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'nick-planner',
    name: "Nick's Personal Planner",
    pin: '7347',
    displayName: 'Nick',
    avatar: '👨‍💼',
    theme: 'blue',
    createdAt: '2024-01-15T10:00:00Z',
    description: 'Personal productivity workspace',
    features: ['Calendar', 'Tasks', 'Goals', 'Analytics'],
    lastLogin: '2024-03-15T14:30:00Z'
  },
  {
    id: 'demo-user',
    name: 'Demo Experience',
    pin: '0000',
    displayName: 'Demo User',
    avatar: '🎯',
    theme: 'green',
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Try all features with sample data',
    features: ['Full Access', 'Sample Data', 'All Features'],
    lastLogin: null,
    isDemoAccount: true
  }
];

export default function LoginClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'welcome' | 'select-account' | 'enter-pin' | 'success'>('welcome');
  const [authProgress, setAuthProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Ensure hydration consistency
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize welcome flow (only after mount to avoid hydration mismatch)
  useEffect(() => {
    if (!isMounted) return;
    
    const hasVisited = localStorage.getItem('has-visited-login');
    if (!hasVisited) {
      setIsFirstTime(true);
      localStorage.setItem('has-visited-login', 'true');
      // Show welcome for 2 seconds, then move to account selection
      setTimeout(() => {
        setStep('select-account');
      }, 2000);
    } else {
      setStep('select-account');
    }
  }, [isMounted]);

  // Auto-fill demo account PIN when selected
  useEffect(() => {
    if (selectedAccount?.id === 'demo-user') {
      setPin('0000');
    } else {
      setPin('');
    }
  }, [selectedAccount]);

  // Check if user is already logged in (only after mount to avoid hydration mismatch)
  useEffect(() => {
    if (!isMounted) return;
    
    const currentUser = localStorage.getItem('current-user');
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [router, isMounted]);

  // Focus PIN input when step changes
  useEffect(() => {
    if (step === 'enter-pin' && pinInputRef.current) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setError('');
    setAuthProgress(25);
    
    // Show selection feedback
    toast({
      title: `${account.name} selected`,
      description: `Welcome back, ${account.displayName}!`,
      duration: 2000,
    });
    
    // Smooth transition to PIN entry
    setTimeout(() => {
      setStep('enter-pin');
      setAuthProgress(50);
    }, 500);
  };

  const handleLogin = async () => {
    if (!selectedAccount || !pin) {
      setError('Please select an account and enter your PIN');
      return;
    }

    setIsLoading(true);
    setError('');
    setAuthProgress(75);

    // Simulate authentication process with progress updates
    const steps = [
      { progress: 80, message: 'Verifying credentials...' },
      { progress: 90, message: 'Setting up workspace...' },
      { progress: 95, message: 'Loading preferences...' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAuthProgress(step.progress);
    }

    if (pin === selectedAccount.pin) {
      setAuthProgress(100);
      setStep('success');
      
      // Store user session
      localStorage.setItem('current-user', JSON.stringify({
        id: selectedAccount.id,
        name: selectedAccount.name,
        displayName: selectedAccount.displayName,
        avatar: selectedAccount.avatar,
        theme: selectedAccount.theme,
        loginTime: new Date().toISOString()
      }));

      // Store account-specific preferences
      localStorage.setItem(`preferences-${selectedAccount.id}`, JSON.stringify({
        theme: selectedAccount.theme,
        notifications: true,
        autoSave: true
      }));

      // Set authentication for backend API calls
      if (selectedAccount.id === 'demo-user') {
        localStorage.setItem('demo-auth', 'true');
        if (typeof window !== 'undefined') {
          (window as any).demoAuthEnabled = true;
        }
      }

      // Success feedback
      toast({
        title: "Welcome back!",
        description: `Successfully signed in to ${selectedAccount.name}`,
        duration: 3000,
      });

      // Redirect after success animation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setError('Invalid PIN. Please try again.');
      setPin('');
      setAuthProgress(50);
      
      // Shake animation for error feedback
      if (pinInputRef.current) {
        pinInputRef.current.classList.add('animate-shake');
        setTimeout(() => {
          pinInputRef.current?.classList.remove('animate-shake');
        }, 500);
      }
      
      toast({
        title: "Authentication failed",
        description: "Please check your PIN and try again",
        variant: "destructive",
        duration: 3000,
      });
    }

    setIsLoading(false);
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input, max 4 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleLogin();
    }
  };

  const goBack = () => {
    setStep('select-account');
    setSelectedAccount(null);
    setPin('');
    setError('');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Astral Chronos</h1>
          <p className="text-gray-600">Sign in to your digital planner</p>
        </div>

        {step === 'select-account' && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center">
                <User className="w-5 h-5" />
                Choose Your Account
              </CardTitle>
              <CardDescription>
                Select your planner account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_ACCOUNTS.map((account) => (
                <motion.div
                  key={account.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAccountSelect(account)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{account.avatar}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-600">
                        {account.id === 'demo-user' ? 'Demo Account - Try the planner' : `Personal planner for ${account.displayName}`}
                      </p>
                    </div>
                    {account.id === 'demo-user' && (
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        Demo
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              <div className="pt-4 border-t">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Demo Account:</strong> PIN auto-fills to 0000 for easy testing<br/>
                    <strong>Nick's Planner:</strong> Use your personal PIN to access your data
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'enter-pin' && selectedAccount && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center">
                <Lock className="w-5 h-5" />
                Enter PIN
              </CardTitle>
              <CardDescription>
                Welcome back, {selectedAccount.displayName}! Enter your 4-digit PIN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Account Display */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xl">{selectedAccount.avatar}</div>
                <div>
                  <p className="font-medium text-gray-900">{selectedAccount.name}</p>
                  <p className="text-sm text-gray-600">Account selected</p>
                </div>
              </div>

              {/* PIN Input */}
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  4-Digit PIN
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your PIN"
                    className="text-center text-lg tracking-widest pr-12"
                    maxLength={4}
                    autoFocus
                  />
                  <EnhancedButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </EnhancedButton>
                </div>
                {selectedAccount.id === 'demo-user' && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Demo PIN auto-filled for easy access
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <EnhancedButton
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </EnhancedButton>
                <EnhancedButton
                  onClick={handleLogin}
                  className="flex-1"
                  disabled={pin.length !== 4 || isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure PIN-based authentication for your personal planner
          </p>
        </div>
      </motion.div>
    </div>
  );
}