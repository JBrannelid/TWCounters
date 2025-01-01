// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/critical.css';  
import './index.css';  
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { CounterProvider } from './contexts/CounterContext';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <HelmetProvider>
      <FirebaseProvider>
        <AuthProvider>
          <ThemeProvider>
            <CounterProvider>
              <App />
            </CounterProvider>
          </ThemeProvider>
        </AuthProvider>
      </FirebaseProvider>
    </HelmetProvider>
  </StrictMode>
);