'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Shield,
  Wifi,
  Server,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AuthError {
  type: 'invalid-pin' | 'account-locked' | 'network-error' | 'server-error' | 'session-expired' | 'rate-limit';
  message: string;
  code?: string;
  retryable: boolean;
  recoveryActions?: AuthRecoveryAction[];
  timestamp: Date;
}

export interface AuthRecoveryAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  primary?: boolean;
}

interface AuthErrorHandlerProps {
  error: AuthError | null;
  onRetry: () => void;
  onClose: () => void;
  onRecoveryAction?: (actionId: string) => void;
  retryAttempts?: number;
  maxRetries?: number;
}

const getErrorIcon = (type: AuthError['type']) => {
  switch (type) {
    case 'invalid-pin':
      return <Shield className="w-5 h-5 text-red-500" />;
    case 'account-locked':
      return <Shield className="w-5 h-5 text-orange-500" />;
    case 'network-error':
      return <Wifi className="w-5 h-5 text-yellow-500" />;
    case 'server-error':
      return <Server className="w-5 h-5 text-red-500" />;
    case 'session-expired':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'rate-limit':
      return <Clock className="w-5 h-5 text-orange-500" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
  }
};

const getErrorSeverity = (type: AuthError['type']): 'low' | 'medium' | 'high' => {
  switch (type) {
    case 'invalid-pin':
    case 'session-expired':
      return 'low';
    case 'network-error':
    case 'rate-limit':
      return 'medium';
    case 'account-locked':
    case 'server-error':
      return 'high';
    default:
      return 'medium';
  }
};

const getErrorColor = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return 'border-blue-200 bg-blue-50';
    case 'medium':
      return 'border-yellow-200 bg-yellow-50';
    case 'high':
      return 'border-red-200 bg-red-50';
  }
};

export default function AuthErrorHandler({
  error,
  onRetry,
  onClose,
  onRecoveryAction,
  retryAttempts = 0,
  maxRetries = 3
}: AuthErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      // Auto-close for low severity errors after 5 seconds
      if (getErrorSeverity(error.type) === 'low') {
        setAutoCloseCountdown(5);
        const interval = setInterval(() => {
          setAutoCloseCountdown(prev => {
            if (prev && prev <= 1) {
              handleClose();
              return null;
            }
            return prev ? prev - 1 : null;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }
    } else {
      setIsVisible(false);
      setAutoCloseCountdown(null);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleRetry = () => {
    setAutoCloseCountdown(null);
    onRetry();
  };

  const handleRecoveryAction = (actionId: string) => {
    onRecoveryAction?.(actionId);
  };

  if (!error) return null;

  const severity = getErrorSeverity(error.type);
  const canRetry = error.retryable && retryAttempts < maxRetries;

  // Default recovery actions based on error type
  const getDefaultRecoveryActions = (error: AuthError): AuthRecoveryAction[] => {
    switch (error.type) {
      case 'invalid-pin':
        return [
          {
            id: 'clear-pin',
            label: 'Clear PIN',
            description: 'Start over with PIN entry',
            icon: <RefreshCw className="w-4 h-4" />,
            action: () => handleRecoveryAction('clear-pin')
          },
          {
            id: 'try-demo',
            label: 'Try Demo',
            description: 'Use demo account instead',
            icon: <CheckCircle className="w-4 h-4" />,
            action: () => handleRecoveryAction('try-demo')
          }
        ];
      case 'network-error':
        return [
          {
            id: 'check-connection',
            label: 'Check Connection',
            description: 'Verify your internet connection',
            icon: <Wifi className="w-4 h-4" />,
            action: () => handleRecoveryAction('check-connection')
          },
          {
            id: 'offline-mode',
            label: 'Work Offline',
            description: 'Continue with limited features',
            icon: <Shield className="w-4 h-4" />,
            action: () => handleRecoveryAction('offline-mode')
          }
        ];
      case 'session-expired':
        return [
          {
            id: 'sign-in-again',
            label: 'Sign In Again',
            description: 'Re-authenticate to continue',
            icon: <Shield className="w-4 h-4" />,
            action: () => handleRecoveryAction('sign-in-again'),
            primary: true
          }
        ];
      default:
        return [];
    }
  };

  const recoveryActions = error.recoveryActions || getDefaultRecoveryActions(error);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4"
        >
          <Card className={`border-2 ${getErrorColor(severity)} shadow-xl`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    {getErrorIcon(error.type)}
                  </motion.div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      Authentication Error
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={
                          severity === 'high' ? 'bg-red-100 text-red-700' :
                          severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }
                      >
                        {severity.toUpperCase()}
                      </Badge>
                      {retryAttempts > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Attempt {retryAttempts + 1}/{maxRetries + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {autoCloseCountdown && (
                    <Badge variant="outline" className="text-xs">
                      Auto-close in {autoCloseCountdown}s
                    </Badge>
                  )}
                  <EnhancedButton
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </EnhancedButton>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Alert variant="destructive" className="mb-4 border-0 bg-transparent p-0">
                <AlertDescription className="text-gray-700 mb-4">
                  {error.message}
                </AlertDescription>
              </Alert>

              {/* Error Code and Timestamp */}
              {(error.code || error.timestamp) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                  {error.code && (
                    <div className="flex justify-between">
                      <span>Error Code:</span>
                      <span className="font-mono">{error.code}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{error.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              {/* Recovery Actions */}
              {recoveryActions.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Recovery Options
                  </h4>
                  {recoveryActions.map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <EnhancedButton
                        variant={action.primary ? "gradient" : "outline"}
                        fullWidth
                        onClick={action.action}
                        leftIcon={action.icon}
                        className="justify-start text-left"
                      >
                        <div>
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs opacity-75">{action.description}</div>
                        </div>
                      </EnhancedButton>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Retry Button */}
              {canRetry && (
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="outline"
                    fullWidth
                    onClick={handleClose}
                  >
                    Cancel
                  </EnhancedButton>
                  <EnhancedButton
                    variant="gradient"
                    fullWidth
                    onClick={handleRetry}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    animation="pulse"
                  >
                    Retry ({maxRetries - retryAttempts} left)
                  </EnhancedButton>
                </div>
              )}

              {/* Max retries reached */}
              {!canRetry && error.retryable && retryAttempts >= maxRetries && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum retry attempts reached. Please try again later or contact support if the issue persists.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}