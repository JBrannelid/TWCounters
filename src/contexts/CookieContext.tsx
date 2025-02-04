import React, { createContext, useContext, useState, useEffect } from 'react';
import { Analytics, logEvent } from 'firebase/analytics';
import { CookieManager } from '@/components/CookieConsent/CookieManager';
import { CookieConsentData } from '@/components/CookieConsent/CookieConsentTypes';
import firebaseClient from '@/lib/firebase'; 
import { getFirebaseAnalytics } from '@/lib/firebase';

// Define the context type for the cookie consent 
interface CookieContextType {
  consent: CookieConsentData | null;
  updateConsent: (newConsent: CookieConsentData) => void;
  resetConsent: () => void;
  isAnalyticsEnabled: boolean;
}

// Create the context and set the default value to undefined
const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<CookieConsentData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Initialize consent state from stored preferences
  useEffect(() => {
    const storedConsent = CookieManager.getStoredConsent();
    if (storedConsent) {
      setConsent(storedConsent);
    }
  }, []);

  // Handle analytics initialization based on consent
  useEffect(() => {
    if (consent?.analytics) {
      try {
        const analyticsInstance = getFirebaseAnalytics(); // Use the getFirebaseAnalytics function to get the analytics instance
        if (analyticsInstance) {
          setAnalytics(analyticsInstance);
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    } else {
      setAnalytics(null);
    }
  }, [consent?.analytics]);

  // Function to update the consent state
  const updateConsent = (newConsent: CookieConsentData) => {
    CookieManager.setConsent(newConsent);
    setConsent(newConsent);

    // Log consent event if analytics is enabled
    if (newConsent.analytics && analytics) {
      logEvent(analytics, 'cookie_consent_updated', {
        consent_type: 'explicit',
        categories_accepted: Object.entries(newConsent)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(',')
      });
    }
  };

  // Function to reset the consent state
  const resetConsent = () => {
    CookieManager.clearConsent();
    setConsent(null);
  };

  // Value to be provided by the context
  const value = {
    consent,
    updateConsent,
    resetConsent,
    isAnalyticsEnabled: Boolean(consent?.analytics)
  };

  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
};

// Custom hook to use the cookie consent context in components 
export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
};