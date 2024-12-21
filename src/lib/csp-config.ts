// define CSP policy and include all the necessary domains for the app to work
// Needed for Firebase, Firestore, Google Cloud Storage, Google Fonts, and YouTube
// Add a protection layer against XSS attacks by disallowing inline scripts and styles
// csp-config.js
export const generateCSPString = (nonce: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const devDirectives = isDevelopment ? {
    'script-src': [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://cdnjs.cloudflare.com",
      "https://*.firebaseio.com",
      "http://localhost:5173",
      "ws://localhost:5173"
    ],
    'style-src': [
  "'self'",
  "'unsafe-inline'",
  "https://fonts.googleapis.com"
],
    'connect-src': [
      "'self'",
      "ws://localhost:5173",
      "http://localhost:5173",
      "https://*.googleapis.com",
      "wss://*.firebaseio.com",
      "https://*.firebaseio.com",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://fonts.gstatic.com",
      "https://*.firebaseio.com",
      "https://firebasestorage.googleapis.com",
    ]
  } : {
    'script-src': [
      "'strict-dynamic'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      `'nonce-${nonce}'`,
      "'self'"
    ],
    'connect-src': [
      "'self'",
      "https://*.googleapis.com",
      "wss://*.firebaseio.com",
      "https://*.firebaseio.com",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com"
    ]
  };

  const baseDirectives = {
    'default-src': ["'self'"],
    'style-src': [
      "'self'",
      "'unsafe-inline'"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https://*.googleapis.com",
      "https://*.google.com",
      "https://firebasestorage.googleapis.com",
      "https://*.googleusercontent.com",
      "https://*.cloudflare.com"
    ],
    'font-src': [
      "'self'",
      "data:",
      "fonts.gstatic.com",
      "https://fonts.gstatic.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.youtube.com",
      "https://www.buymeacoffee.com"
    ],
    'media-src': ["'self'"],
    'worker-src': ["'self'", "blob:"],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': []
  };

  const directives = {
    ...baseDirectives,
    ...devDirectives
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
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