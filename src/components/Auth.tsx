import React, { useState, useEffect } from 'react';
import { LogIn, User, EyeOff, Eye, AlertCircle, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
  onLogin: (success: boolean) => void;
  onClose: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    // Maximum of 5 login attempts
    try {
      if (attemptCount >= 5) { 
        throw new Error('Too many login attempts. Please try again later.');
      }

      await login(credentials.email, credentials.password); // Login with email and password
      onLogin(true);
      navigate('/admin'); // Redirect to admin page
      onClose(); // Close the dialog on success
    } catch (error) {
      console.error('Login error:', error);
      setAttemptCount(prev => prev + 1); // Increment attempt count
      setLocalError(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setIsLoading(false); // Reset loading state after login attempt is complete 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-space-darker rounded-lg border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Log in</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-white/40 focus:outline-none focus:ring-2 
                           focus:ring-blue-400/50 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2 bg-white/5 border border-white/10 rounded-lg 
                          text-white placeholder-white/40 focus:outline-none focus:ring-2 
                          focus:ring-blue-400/50 focus:border-transparent h-10"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white 
                          transition-colors flex items-center justify-center
                          w-5 h-5 hover:bg-white/5 rounded-full"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
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
                disabled={isLoading || attemptCount >= 5}
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

            {attemptCount >= 5 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-yellow-400 mt-4"
              >
                Too many login attempts. Please try again later.
              </motion.p>
            )}
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Auth;