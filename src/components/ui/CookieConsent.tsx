import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieConsentProps {
  cbid: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  cbid,
  onAccept,
  onDecline
}) => {
  useEffect(() => {
    // Kontrollera om vi är i produktion
    if (import.meta.env.DEV) {
      console.log('Cookiebot disabled in development');
      return;
    }

    if (document.getElementById('Cookiebot')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'Cookiebot';
    script.src = 'https://consent.cookiebot.com/uc.js';
    script.setAttribute('data-cbid', cbid);
    script.setAttribute('data-blockingmode', 'auto');
    script.defer = true;
    script.type = 'text/javascript';

    script.onerror = (error) => {
      console.error('Error loading Cookiebot:', error);
    };

    const head = document.getElementsByTagName('head')[0];
    head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('Cookiebot');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [cbid]);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const handleConsentChange = (e: any) => {
      if (e.detail?.consent?.marketing) {
        onAccept?.();
      } else {
        onDecline?.();
      }
    };

    window.addEventListener('CookiebotOnAccept', handleConsentChange);
    window.addEventListener('CookiebotOnDecline', handleConsentChange);

    return () => {
      window.removeEventListener('CookiebotOnAccept', handleConsentChange);
      window.removeEventListener('CookiebotOnDecline', handleConsentChange);
    };
  }, [onAccept, onDecline]);

  // Visa inget i utvecklingsmiljö
  if (import.meta.env.DEV) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div id="CookiebotWidget"></div>
      </motion.div>
    </AnimatePresence>
  );
};