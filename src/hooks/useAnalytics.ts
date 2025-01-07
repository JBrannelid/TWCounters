// src/hooks/useAnalytics.ts

import { useCallback } from 'react';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { useCookieConsent } from '@/contexts/CookieContext';
import firebaseClient from '@/lib/firebase';

export const useAnalytics = () => {
  const { isAnalyticsEnabled } = useCookieConsent();

  const logEvent = useCallback((eventName: string, eventParams?: { [key: string]: any }) => {
    if (isAnalyticsEnabled) {
      try {
        const analytics = firebaseClient.analytics;
        firebaseLogEvent(analytics, eventName, eventParams);
      } catch (error) {
        console.error('Failed to log analytics event:', error);
      }
    }
  }, [isAnalyticsEnabled]);

  const logPageView = useCallback((pageName: string, pageProps?: { [key: string]: any }) => {
    logEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...pageProps
    });
  }, [logEvent]);

  const logUserAction = useCallback((action: string, actionProps?: { [key: string]: any }) => {
    logEvent('user_action', {
      action_type: action,
      ...actionProps
    });
  }, [logEvent]);

  return {
    isEnabled: isAnalyticsEnabled,
    logEvent,
    logPageView,
    logUserAction
  };
};