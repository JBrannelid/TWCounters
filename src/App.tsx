import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CookieProvider } from '@/contexts/CookieContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { CounterProvider } from '@/contexts/CounterContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components
const AppContent = React.lazy(() => import('./components/AppContent').then(module => ({
  default: module.AppContent
})));

const CookiePolicy = React.lazy(() => import('./components/CookieConsent/CookiePolicy').then(module => ({
  default: module.CookiePolicy
})));

const App: React.FC = () => {
  return (
    <Router>
      <HelmetProvider>
        <CookieProvider>
          <ErrorBoundary 
            fallback={
              <div className="min-h-screen bg-space-darker flex items-center justify-center">
                <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-red-400 mb-2">
                    Application Error
                  </h3>
                  <p className="text-sm text-red-400/80 mb-6">
                    We apologize, but something went wrong with the application. 
                    Please try refreshing the page.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg 
                             bg-red-500/20 text-red-400 hover:bg-red-500/30 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Application
                  </button>
                </div>
              </div>
            }
          >
            <FirebaseProvider>
              <AuthProvider>
                <ThemeProvider>
                  <CounterProvider>
                    <Suspense 
                      fallback={
                        <div className="min-h-screen bg-space-darker flex items-center justify-center">
                          <LoadingIndicator size="lg" message="Loading..." />
                        </div>
                      }
                    >
                      <Routes>
                        <Route path="/" element={<AppContent />} />
                        <Route path="/cookie-policy" element={<CookiePolicy />} />
                      </Routes>
                    </Suspense>
                  </CounterProvider>
                </ThemeProvider>
              </AuthProvider>
            </FirebaseProvider>
          </ErrorBoundary>
        </CookieProvider>
      </HelmetProvider>
    </Router>
  );
};

export default App;