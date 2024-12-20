// define CSP policy and include all the necessary domains for the app to work
// Needed for Firebase, Firestore, Google Cloud Storage, Google Fonts, and YouTube
// Add a protection layer against XSS attacks by disallowing inline scripts and styles
// csp-config.js
export const CSP_POLICY = (nonce?: string) => {
    const isDevelopment = process.env.NODE_ENV === 'development'; // Kontrollera om det är utvecklingsläge
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        //"'unsafe-eval'",  // Tillåt 'unsafe-eval' om du använder det
        isDevelopment ? "'unsafe-inline'" : "",  // Tillåt inline-skript endast i utveckling
        "http://localhost:5173",
        "http://localhost:5174",
        "https://cdnjs.cloudflare.com",
        "https://www.buymeacoffee.com",
        ...(nonce ? [`'nonce-${nonce}'`] : []),
      ],
      'style-src': [
        "'self'",
        //"'unsafe-inline'", // Tillåt inline-stilar
        "https://fonts.googleapis.com"
      ],
      'img-src': [
        "'self'",
        "data:",           // Tillåt inbäddade bilder (data URLs)
        "blob:",           // Tillåt blob URLs
        "https://*.googleapis.com", // Google API-domäner för bilder
        "https://*.google.com", // Google domäner för bilder
        "https://img.youtube.com", // YouTube bilder
        "https://firebase.googleapis.com", // Firebase API
        "https://firebasestorage.googleapis.com", // Firebase Storage (för bilder)
        "https://*.cloudflare.com" // Cloudflare CDN-domäner
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com" // Google Fonts
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
        "https://securetoken.googleapis.com"
      ],
      'frame-src': [
        "'self'",
        "https://www.youtube.com",
        "https://www.buymeacoffee.com"
      ],
      'manifest-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'media-src': ["'self'"],
      'worker-src': ["'self'", "blob:"],
      'frame-ancestors': ["'none'"]
    };
  };


  export const generateCSPString = (nonce: string | undefined) => {
    const sanitizedNonce = nonce ? encodeURIComponent(nonce) : '';
    return `
      default-src 'self';
      script-src 'self' 'nonce-${sanitizedNonce}' 'unsafe-eval' 'unsafe-inline' 
        http://localhost:5173 
        http://localhost:5174 
        https://cdnjs.cloudflare.com 
        https://www.buymeacoffee.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://firebasestorage.googleapis.com 
        https://*.googleapis.com 
        https://*.google.com 
        https://img.youtube.com 
        https://*.cloudflare.com;
      connect-src 'self' 
        ws://localhost:5173 
        http://localhost:5173 
        https://*.googleapis.com 
        wss://*.firebaseio.com 
        https://*.firebaseio.com 
        https://firestore.googleapis.com 
        https://identitytoolkit.googleapis.com 
        https://securetoken.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      base-uri 'self';
      form-action 'self';
      media-src 'self';
      worker-src 'self' blob:;
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim();
};
