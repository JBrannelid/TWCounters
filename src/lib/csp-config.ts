// define CSP policy and include all the necessary domains for the app to work
// Needed for Firebase, Firestore, Google Cloud Storage, Google Fonts, and YouTube
// Add a protection layer against XSS attacks by disallowing inline scripts and styles
// csp-config.js

export const generateCSPString = (nonce: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://apis.google.com" // Add this line
    ],
    'script-src-elem': [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://apis.google.com" // Add this line
    ],
    'connect-src': [
      "'self'",
      "https://*.googleapis.com",
      "wss://*.firebaseio.com",
      "https://*.firebaseio.com",
      "https://region1.google-analytics.com"
    ],
    'frame-src': [
      "'self'",
      "https://apis.google.com", // Add this line for iframes
      "https://swgoh-tw-guide.firebaseapp.com"  // Add this line
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https://firebasestorage.googleapis.com"
    ],
    'font-src': ["'self'", "data:", "https://fonts.gstatic.com"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"]
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (!values || !values.length) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

// Helper functions for nonces
export const applyNonceToElement = (element: HTMLElement, nonce: string): void => {
  if (element.hasAttribute('src') || element.hasAttribute('href')) {
    element.setAttribute('nonce', nonce);
  }
};

export const createScriptElement = (src: string, nonce: string): HTMLScriptElement => {
  const script = document.createElement('script');
  script.src = src;
  script.nonce = nonce;
  return script;
};