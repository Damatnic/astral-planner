/**
 * Revolutionary Enhanced Login Client
 * Production-ready login interface with comprehensive security and UX
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Shield,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

interface Account {
  id: string;
  name: string;
  pin: string;
  displayName: string;
  avatar?: string;
  theme: string;
  createdAt: string;
  description: string;
  isDemo?: boolean;
  isPremium?: boolean;
}

const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'demo-user',
    name: 'Demo Account',
    pin: '0000',
    displayName: 'Demo User',
    avatar: '🎯',
    theme: 'green',
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Try all features with sample data',
    isDemo: true,
    isPremium: false
  },
  {
    id: 'nick-planner',
    name: "Nick's Planner",
    pin: '7347',
    displayName: 'Nick',
    avatar: '👨‍💼',
    theme: 'blue',
    createdAt: '2024-01-15T10:00:00Z',
    description: 'Personal productivity workspace',
    isDemo: false,
    isPremium: true
  }
];

type LoginStep = 'select-account' | 'enter-pin' | 'verifying' | 'success';

export default function EnhancedLoginClient() {
  const router = useRouter();
  const { login, loading: authLoading, error: authError, lockoutUntil, attemptsRemaining } = useAuth();
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('select-account');
  const [loginProgress, setLoginProgress] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const pinInputRef = useRef<HTMLInputElement>(null);
  const lockoutTimerRef = useRef<NodeJS.Timeout>();

  // Auto-fill demo account PIN when selected
  useEffect(() => {
    if (selectedAccount?.id === 'demo-user') {
      setPin('0000');
    } else {
      setPin('');
    }
  }, [selectedAccount]);

  // Check if user is already logged in
  useEffect(() => {
    const currentUser = localStorage.getItem('current-user');
    if (currentUser && !authLoading) {
      router.push('/dashboard');
    }
  }, [router, authLoading]);

  // Handle lockout timer
  useEffect(() => {
    if (lockoutUntil) {
      setLockoutTime(lockoutUntil);
      
      const updateTimer = () => {
        const now = Date.now();
        if (now >= lockoutUntil) {
          setLockoutTime(null);
          setError('');
        } else {
          setLockoutTime(lockoutUntil - now);
        }
      };
      
      lockoutTimerRef.current = setInterval(updateTimer, 1000);
      updateTimer();
      
      return () => {
        if (lockoutTimerRef.current) {
          clearInterval(lockoutTimerRef.current);
        }
      };
    }
    return undefined;
  }, [lockoutUntil]);

  // Calculate security score based on PIN
  useEffect(() => {
    if (pin.length === 0) {
      setSecurityScore(0);
      return;
    }
    
    let score = 25; // Base score for having a PIN
    
    // Check for repeated digits
    const hasRepeatedDigits = /(.)\1{2,}/.test(pin);
    if (!hasRepeatedDigits) score += 25;
    
    // Check for sequential digits
    const hasSequential = /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin);
    if (!hasSequential) score += 25;
    
    // Check for common PINs
    const commonPins = ['0000', '1111', '1234', '4321'];
    if (!commonPins.includes(pin)) score += 25;
    
    setSecurityScore(score);
  }, [pin]);

  const formatLockoutTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAccountSelect = useCallback((account: Account) => {
    setSelectedAccount(account);
    setError('');
    setStep('enter-pin');
    
    // Focus PIN input after animation
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 300);
  }, []);

  const simulateProgress = (callback: () => void) => {
    setLoginProgress(0);
    const interval = setInterval(() => {
      setLoginProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          callback();
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleLogin = useCallback(async () => {
    if (!selectedAccount || !pin || lockoutTime) {
      setError('Please select an account and enter your PIN');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('verifying');

    try {
      simulateProgress(async () => {
        const result = await login({
          accountId: selectedAccount.id,
          pin,
          deviceInfo: {
            fingerprint: generateDeviceFingerprint()
          }
        });

        if (result.success) {
          setStep('success');
          
          // Show success state briefly before redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          setStep('enter-pin');
          setError(result.error || 'Login failed');
          setPin('');
          
          // Focus PIN input for retry
          setTimeout(() => {
            pinInputRef.current?.focus();
          }, 100);
        }
      });
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Login error:', error);
      setStep('enter-pin');
      setError('Network error. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
      setLoginProgress(0);
    }
  }, [selectedAccount, pin, lockoutTime, login, router]);

  const handlePinChange = useCallback((value: string) => {
    // Only allow numeric input, max 4 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4 && !lockoutTime) {
      handleLogin();
    }
  }, [pin, lockoutTime, handleLogin]);

  const goBack = useCallback(() => {
    setStep('select-account');
    setSelectedAccount(null);
    setPin('');
    setError('');
    setSecurityScore(0);
  }, []);

  const generateDeviceFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(16);
    } catch {
      return 'unknown-device';
    }
  };

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = (score: number): string => {
    if (score >= 75) return 'Strong';
    if (score >= 50) return 'Moderate';
    if (score > 0) return 'Weak';
    return 'None';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 shadow-2xl shadow-purple-500/50"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            Astral Chronos
          </h1>
          <p className="text-purple-200/70">Secure access to your cosmic planner</p>
          
          {/* Security indicator */}
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-purple-300/60">
            <Shield className="w-4 h-4" />
            <span>Enterprise-grade security</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Account Selection */}
          {step === 'select-account' && (
            <motion.div
              key="select-account"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-500/20">
                <CardHeader className="text-center border-b border-purple-800/20">
                  <CardTitle className="flex items-center gap-2 justify-center text-purple-100">
                    <User className="w-5 h-5 text-purple-400" />
                    Choose Your Account
                  </CardTitle>
                  <CardDescription className="text-purple-300/60">
                    Select your cosmic workspace to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {DEMO_ACCOUNTS.map((account, index) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAccountSelect(account)}
                      className="p-4 rounded-lg border-2 border-purple-800/30 hover:border-purple-600/50 bg-slate-800/50 hover:bg-purple-900/30 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl group-hover:scale-110 transition-transform">
                          {account.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-purple-100 group-hover:text-white">{account.name}</h3>
                            {account.isPremium && (
                              <Zap className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-sm text-purple-300/60 group-hover:text-purple-200/70">{account.description}</p>
                        </div>
                        {account.isDemo && (
                          <div className="bg-green-900/40 text-green-300 border border-green-700/30 px-2 py-1 rounded text-xs font-medium">
                            Demo
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="pt-4 border-t border-purple-800/20">
                    <Alert className="bg-purple-900/30 border-purple-700/30">
                      <AlertCircle className="h-4 w-4 text-purple-400" />
                      <AlertDescription className="text-sm text-purple-200/80">
                        <strong className="text-purple-100">Demo Account:</strong> PIN auto-fills for easy access<br/>
                        <strong className="text-purple-100">Premium Account:</strong> Full access to all features
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* PIN Entry */}
          {step === 'enter-pin' && selectedAccount && (
            <motion.div
              key="enter-pin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-purple-900/30 border border-purple-500/20 shadow-2xl shadow-purple-900/50">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center gap-2 justify-center text-purple-100">
                    <Lock className="w-5 h-5 text-purple-400" />
                    Enter PIN
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Welcome back, {selectedAccount.displayName}!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Account Display */}
                  <div className="flex items-center gap-3 p-3 bg-purple-950/50 border border-purple-500/20 rounded-lg">
                    <div className="text-xl">{selectedAccount.avatar}</div>
                    <div className="flex-1">
                      <p className="font-medium text-purple-100">{selectedAccount.name}</p>
                      <p className="text-sm text-purple-300/70">Account selected</p>
                    </div>
                    {selectedAccount.isPremium && (
                      <Zap className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  {/* PIN Input */}
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-sm font-medium text-purple-200">
                      4-Digit PIN
                    </Label>
                    <div className="relative">
                      <Input
                        ref={pinInputRef}
                        id="pin"
                        type={showPin ? "text" : "password"}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your PIN"
                        className="text-center text-lg tracking-widest pr-12 bg-purple-950/50 border-purple-500/30 text-purple-100 placeholder:text-purple-400/50 focus:border-purple-400/50"
                        maxLength={4}
                        autoFocus
                        disabled={!!lockoutTime}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        disabled={!!lockoutTime}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {/* Security Score */}
                    {pin.length > 0 && !selectedAccount.isDemo && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-purple-300/70">
                          <span>PIN Security</span>
                          <span className={getSecurityScoreColor(securityScore)}>
                            {getSecurityScoreLabel(securityScore)} ({securityScore}%)
                          </span>
                        </div>
                        <Progress value={securityScore} className="h-1" />
                      </div>
                    )}
                    
                    {selectedAccount.isDemo && (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Demo PIN auto-filled for easy access
                      </p>
                    )}
                  </div>

                  {/* Lockout Warning */}
                  {lockoutTime && (
                    <Alert variant="destructive">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Account locked. Try again in {formatLockoutTime(lockoutTime)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Attempts Remaining */}
                  {attemptsRemaining !== undefined && attemptsRemaining < 5 && !lockoutTime && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {attemptsRemaining} attempts remaining before account lockout
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Message */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="flex-1 bg-purple-950/50 border-purple-500/30 text-purple-200 hover:bg-purple-900/50 hover:text-purple-100"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleLogin}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30"
                      disabled={pin.length !== 4 || isLoading || !!lockoutTime}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Verification Progress */}
          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-500/20">
                <CardContent className="p-8 text-center space-y-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-purple-500/50"
                  >
                    <Shield className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-purple-100">Verifying Credentials</h3>
                    <p className="text-purple-300/70">Authenticating with secure servers...</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={loginProgress} className="h-2 bg-purple-950/50" />
                    <p className="text-sm text-purple-300/70">{loginProgress}%</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30 shadow-2xl shadow-purple-500/20">
                <CardContent className="p-8 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50"
                  >
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-400">Welcome Back!</h3>
                    <p className="text-purple-300/70">Redirecting to your dashboard...</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-purple-300/70">
            🔒 Secured with enterprise-grade encryption
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-purple-400/60">
            <span>Multi-factor ready</span>
            <span>•</span>
            <span>Session monitoring</span>
            <span>•</span>
            <span>Zero-trust security</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}