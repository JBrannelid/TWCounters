import { useCallback } from 'react';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { useCookieConsent } from '@/contexts/CookieContext';
import firebaseClient from '@/lib/firebase';

// Custom hook for logging analytics events with Firebase
export const useAnalytics = () => {
  const { isAnalyticsEnabled } = useCookieConsent();

  // Log an event with Firebase Analytics if it's enabled in the user's cookie preferences
  const logEvent = useCallback((eventName: string, eventParams?: { [key: string]: any }) => {
    if (isAnalyticsEnabled) {
      try {
        const analytics = firebaseClient.analytics;
        if (analytics) {
          firebaseLogEvent(analytics, eventName, eventParams); // Log the event with Firebase Analytics
        } else { // Log a warning if Firebase Analytics is not initialized
          console.warn('Analytics is not initialized, skipping log event:', eventName);
        }
      } catch (error) { // Log an error if the event fails to log
        console.error('Failed to log analytics event:', error);
      }
    }
  }, [isAnalyticsEnabled]); // Re-run the hook when the analytics preference changes

  // Log a page view event with additional page properties
  const logPageView = useCallback((pageName: string, pageProps?: { [key: string]: any }) => {
    logEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...pageProps
    });
  }, [logEvent]);

  // Log a user action event with additional action properties
  const logUserAction = useCallback((action: string, actionProps?: { [key: string]: any }) => {
    logEvent('user_action', {
      action_type: action,
      ...actionProps
    });
  }, [logEvent]); // Re-run the hook when the logEvent function changes

  return {
    isEnabled: isAnalyticsEnabled,
    logEvent,
    logPageView,
    logUserAction
  };
};