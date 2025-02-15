import React, { useState, useEffect } from 'react';
import { LogIn, User, EyeOff, Eye, AlertCircle, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateAndSanitizeFormField } from '@/lib/security/formValidation';
import { sanitizeInput } from '@/lib/security/Sanitizer';
// import { createFocusTrap } from 'focus-trap';

interface AuthProps {
  onLogin: (success: boolean) => void;
  onClose: () => void;
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxAttempts: 5,
  timeWindow: 30 * 60 * 1000, // 30 minutes
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
};

export const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Rate limiting state
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  useEffect(() => {
    // Check if there's an existing lockout
    const storedLockout = localStorage.getItem('auth_lockout');
    if (storedLockout) {
      const lockoutData = JSON.parse(storedLockout);
      const now = Date.now();
      if (now < lockoutData.endTime) {
        setIsLocked(true);
        setLockoutEndTime(lockoutData.endTime);
      } else {
        localStorage.removeItem('auth_lockout');
      }
    }
  }, []);

  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  // Secure input validation
  const validateInput = (name: string, value: string): string => {
    const validation = validateAndSanitizeFormField(value, name, {
      required: true,
      minLength: name === 'password' ? 8 : 5,
      maxLength: 100,
      allowHTML: false
    });

    if (!validation.isValid) {
      return validation.error || `Invalid ${name}`;
    }

    // Additional email validation
    if (name === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email format';
      }
    }

    // Additional password validation
    if (name === 'password') {
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!/[a-z]/.test(value)) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must contain at least one number';
      }
    }

    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input
    const sanitizedValue = sanitizeInput(value);
    
    // Update credentials
    setCredentials(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Validate and set errors
    const error = validateInput(name, sanitizedValue);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    
    // Check if currently locked out
    if (isLocked && lockoutEndTime && now < lockoutEndTime) {
      return false;
    }

    // Reset attempt count if outside time window
    if (lastAttemptTime && (now - lastAttemptTime > RATE_LIMIT.timeWindow)) {
      setAttemptCount(0);
      return true;
    }

    // Check if max attempts reached
    if (attemptCount >= RATE_LIMIT.maxAttempts) {
      const lockoutEndTime = now + RATE_LIMIT.lockoutDuration;
      setIsLocked(true);
      setLockoutEndTime(lockoutEndTime);
      
      // Store lockout in localStorage
      localStorage.setItem('auth_lockout', JSON.stringify({
        endTime: lockoutEndTime
      }));
      
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate all inputs first
    const emailError = validateInput('email', credentials.email);
    const passwordError = validateInput('password', credentials.password);

    if (emailError || passwordError) {
      setValidationErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    // Check rate limiting
    if (!checkRateLimit()) {
      const remainingTime = (lockoutEndTime || 0) - Date.now();
      const minutesLeft = Math.ceil(remainingTime / 60000);
      setLocalError(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
      return;
    }

    setIsLoading(true);

    try {
      await login(credentials.email, credentials.password);
      onLogin(true);
      navigate('/admin');
      onClose();
      
      // Reset rate limiting on successful login
      setAttemptCount(0);
      setLastAttemptTime(null);
      setIsLocked(false);
      localStorage.removeItem('auth_lockout');
      
    } catch (error) {
      console.error('Login error:', error);
      setAttemptCount(prev => prev + 1);
      setLastAttemptTime(Date.now());
      setLocalError(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  // UI implementation remains largely the same but with added security attributes
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-space-darker rounded-lg border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Form header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Log in</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2 bg-white/5 border 
                         ${validationErrors.email ? 'border-red-500' : 'border-white/10'} 
                         rounded-lg text-white placeholder-white/40`}
                placeholder="Enter your email"
                required
                disabled={isLoading || isLocked}
                autoComplete="email"
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? "email-error" : undefined}
              />
              <User className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
              {validationErrors.email && (
                <div id="email-error" className="text-red-500 text-sm mt-1">
                  {validationErrors.email}
                </div>
              )}
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-2 bg-white/5 border 
                         ${validationErrors.password ? 'border-red-500' : 'border-white/10'} 
                         rounded-lg text-white placeholder-white/40`}
                placeholder="Enter your password"
                required
                disabled={isLoading || isLocked}
                autoComplete="current-password"
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-white/40 hover:text-white"
                disabled={isLoading || isLocked}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              {validationErrors.password && (
                <div id="password-error" className="text-red-500 text-sm mt-1">
                  {validationErrors.password}
                </div>
              )}
            </div>
          </div>

          {/* Error messages */}
          <AnimatePresence>
            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 
                         flex items-start gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{localError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isLocked || !!validationErrors.email || !!validationErrors.password}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
                       flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                  />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log in</span>
                </>
              )}
            </button>
          </div>

          {/* Rate limit warning */}
          {attemptCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-yellow-400 mt-4"
            >
              {`${RATE_LIMIT.maxAttempts - attemptCount} login attempts remaining`}
            </motion.p>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Auth;