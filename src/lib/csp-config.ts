// define CSP policy and include all the necessary domains for the app to work
// Needed for Firebase, Firestore, Google Cloud Storage, Google Fonts, and YouTube
// Add a protection layer against XSS attacks by disallowing inline scripts and styles
// csp-config.js

export const generateCSPString = (nonce: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development, allow 'unsafe-eval' for hot reloading
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://apis.google.com" 
    ],
    'script-src-elem': [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://apis.google.com" 
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
      "https://apis.google.com", 
      "https://swgoh-tw-guide.firebaseapp.com"  
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
    .join('; '); // Join all the directives with a semicolon for the CSP header
};

// Helper functions for nonces and CSP headers in Express 
export const applyNonceToElement = (element: HTMLElement, nonce: string): void => {
  if (element.hasAttribute('src') || element.hasAttribute('href')) { // Check if the element has a src or href attribute
    element.setAttribute('nonce', nonce); // Add a nonce attribute to the element
  }
};

// Helper function to create a script element with a nonce attribute 
export const createScriptElement = (src: string, nonce: string): HTMLScriptElement => {
  const script = document.createElement('script'); // Create a new script element 
  script.src = src;
  script.nonce = nonce;
  return script;
};