'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye,
  EyeOff,
  Delete,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { EnhancedButton } from '@/components/ui/enhanced-button';

interface MobilePinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  maxLength?: number;
  showValue?: boolean;
  onShowValueToggle?: () => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  hapticFeedback?: boolean;
  biometricEnabled?: boolean;
  onBiometricAuth?: () => void;
}

export default function MobilePinInput({
  value,
  onChange,
  onComplete,
  maxLength = 4,
  showValue = false,
  onShowValueToggle,
  error,
  success = false,
  disabled = false,
  autoFocus = false,
  hapticFeedback = true,
  biometricEnabled = false,
  onBiometricAuth
}: MobilePinInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === maxLength && onComplete) {
      onComplete(value);
    }
  }, [value, maxLength, onComplete]);

  const triggerHaptic = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    
    triggerHaptic();
    const newValue = value + digit;
    onChange(newValue);
  };

  const handleDelete = () => {
    if (disabled || value.length === 0) return;
    
    triggerHaptic();
    const newValue = value.slice(0, -1);
    onChange(newValue);
  };

  const handleClear = () => {
    if (disabled) return;
    
    triggerHaptic();
    onChange('');
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange(inputValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const pinDigits = Array.from({ length: maxLength }, (_, index) => {
    const hasValue = index < value.length;
    const isActive = index === value.length;
    return { hasValue, isActive, value: hasValue ? value[index] : '' };
  });

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Hidden input for accessibility and native keyboard */}
      <input
        ref={hiddenInputRef}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleHiddenInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="sr-only"
        aria-label="PIN input"
        maxLength={maxLength}
        autoComplete="one-time-code"
      />

      {/* PIN Display */}
      <div className="space-y-6">
        {/* PIN Dots/Digits */}
        <div 
          className="flex justify-center gap-3 cursor-pointer"
          onClick={handleFocus}
        >
          {pinDigits.map((digit, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: digit.isActive && isFocused ? 1.1 : 1,
                opacity: 1,
                backgroundColor: digit.hasValue 
                  ? success ? '#10b981' 
                    : error ? '#ef4444' 
                    : '#3b82f6'
                  : '#e5e7eb'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                backgroundColor: { duration: 0.2 }
              }}
              className={`
                relative w-14 h-14 rounded-2xl border-2 flex items-center justify-center
                ${digit.isActive && isFocused 
                  ? 'border-blue-400 shadow-lg shadow-blue-200' 
                  : error
                  ? 'border-red-300'
                  : success
                  ? 'border-green-300'
                  : 'border-gray-200'
                }
                ${disabled ? 'opacity-50' : ''}
                transition-all duration-200
              `}
            >
              {digit.hasValue && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="text-white text-xl font-bold"
                >
                  {showValue ? digit.value : '•'}
                </motion.div>
              )}
              
              {/* Active indicator */}
              {digit.isActive && isFocused && !digit.hasValue && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border-2 border-blue-400"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {/* Show/Hide PIN */}
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={onShowValueToggle}
            disabled={disabled || value.length === 0}
            className="w-12 h-12"
          >
            {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </EnhancedButton>

          {/* Clear Button */}
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled || value.length === 0}
            className="w-12 h-12"
          >
            <Delete className="w-5 h-5" />
          </EnhancedButton>

          {/* Biometric Auth */}
          {biometricEnabled && (
            <EnhancedButton
              variant="outline"
              size="icon"
              onClick={onBiometricAuth}
              disabled={disabled}
              className="w-12 h-12"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H11V21H5V3H13V9H21ZM17 11C15.9 11 15 11.9 15 13S15.9 15 17 15 19 14.1 19 13 18.1 11 17 11ZM12 8C10.9 8 10 8.9 10 10S10.9 12 12 12 14 11.1 14 10 13.1 8 12 8Z" 
                  fill="currentColor"
                />
              </svg>
            </EnhancedButton>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <motion.div key={digit}>
              <EnhancedButton
                variant="outline"
                onClick={() => handleKeyPress(digit.toString())}
                disabled={disabled || value.length >= maxLength}
                className="w-full h-14 text-xl font-semibold"
              >
                {digit}
              </EnhancedButton>
            </motion.div>
          ))}
          
          {/* Bottom row */}
          <div></div> {/* Empty space */}
          <motion.div>
            <EnhancedButton
              variant="outline"
              onClick={() => handleKeyPress('0')}
              disabled={disabled || value.length >= maxLength}
              className="w-full h-14 text-xl font-semibold"
            >
              0
            </EnhancedButton>
          </motion.div>
          <motion.div>
            <EnhancedButton
              variant="outline"
              onClick={handleDelete}
              disabled={disabled || value.length === 0}
              className="w-full h-14"
            >
              <Delete className="w-6 h-6" />
            </EnhancedButton>
          </motion.div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">PIN verified successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="flex justify-center">
          <div className="flex gap-1">
            {Array.from({ length: maxLength }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: index < value.length ? 1 : 0.8,
                  backgroundColor: index < value.length 
                    ? success ? '#10b981' 
                      : error ? '#ef4444' 
                      : '#3b82f6'
                    : '#d1d5db'
                }}
                transition={{ duration: 0.2 }}
                className="w-2 h-2 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}