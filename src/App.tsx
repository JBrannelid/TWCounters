import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CookieProvider } from '@/contexts/CookieContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { CounterProvider } from '@/contexts/CounterContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { MainRoutes } from './MainRoutes';

// Application root component
const App: React.FC = () => {
  return (
    <ErrorBoundary 
      fallback={
        <div className="min-h-screen bg-space-darker flex items-center justify-center">
          <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full text-center">
            <h3 className="text-xl font-medium text-red-400 mb-2">
              Application Error
            </h3>
            <p className="text-sm text-red-400/80 mb-6">
              Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg 
                       bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              Reload Application
            </button>
          </div>
        </div>
      }
    >
      <HelmetProvider>
        <Router>
          <FirebaseProvider>
            <AuthProvider>
              <CookieProvider>
                <ThemeProvider>
                  <CounterProvider>
                    <Suspense 
                      fallback={
                        <div className="min-h-screen bg-space-darker flex items-center justify-center">
                          <LoadingIndicator size="lg" message="Loading..." />
                        </div>
                      }
                    >
                      <MainRoutes />
                    </Suspense>
                  </CounterProvider>
                </ThemeProvider>
              </CookieProvider>
            </AuthProvider>
          </FirebaseProvider>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;