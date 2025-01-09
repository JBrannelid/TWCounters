// src/utils/analytics.ts
export const shouldEnableAnalytics = (): boolean => {
    // Only enable in production and browser environment
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return false;
    }
  
    // Check if analytics cookies are allowed
    try {
      const cookieConsent = localStorage.getItem('cookie_consent_state');
      if (cookieConsent) {
        const { analytics } = JSON.parse(cookieConsent);
        return Boolean(analytics);
      }
    } catch (error) {
      console.warn('Failed to check analytics consent:', error);
    }
  
    return false;
  };