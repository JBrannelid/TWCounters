export interface Cookie {
  name: string;
  description: string;
  duration: string;
  type: string;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: Cookie[];
}

export interface CookieConsentData {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export interface CookieConsentProps {
  onAccept?: (consent: CookieConsentData) => void;
  onDecline?: () => void;
}

export const COOKIE_CONSENT_KEY = 'cookie_consent_state';

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary',
    description: 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.',
    required: true,
    enabled: true,
    cookies: [
      {
        name: 'cookie_consent_state',
        description: 'Stores your cookie consent preferences',
        duration: '1 year',
        type: 'Local Storage'
      },
      {
        name: 'firebase-heartbeat-database',
        description: 'Used to maintain secure Firebase connectivity',
        duration: 'Session',
        type: 'IndexedDB'
      },
      {
        name: 'theme',
        description: 'Stores your theme preferences',
        duration: 'Persistent',
        type: 'Local Storage'
      }
    ]
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Preference cookies enable the website to remember information that changes the way the website behaves or looks, like your preferred language or the region you are in.',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'display_settings',
        description: 'Stores your display preferences for squad and fleet layouts',
        duration: '1 year',
        type: 'Local Storage'
      },
      {
        name: 'ui_preferences',
        description: 'Remembers your UI customization settings',
        duration: '1 year',
        type: 'Local Storage'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Analytics cookies help website owners understand how visitors interact with websites by collecting and reporting information anonymously.',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'firebase-analytics',
        description: 'Used to collect anonymous usage statistics',
        duration: '2 years',
        type: 'HTTP Cookie'
      },
      {
        name: 'performance_data',
        description: 'Collects anonymous performance metrics',
        duration: '1 year',
        type: 'Local Storage'
      }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'ad_preferences',
        description: 'Stores ad personalization settings',
        duration: '1 year',
        type: 'Local Storage'
      }
    ]
  }
];