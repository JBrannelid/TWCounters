import DOMPurify from 'dompurify';

// function for sanitizing user input
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // don't allow any HTML tags
    ALLOWED_ATTR: [], // don't allow any attributes
  });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], // reduce the allowed tags to a small subset
    ALLOWED_ATTR: ['href'], // reduce the allowed attributes to a small subset
    ALLOW_DATA_ATTR: false, // reduce the allowed data attributes to a small subset
    ADD_ATTR: ['target'], // reduce the allowed attributes to a small subset
    FORBID_TAGS: ['style', 'script', 'iframe'], // forbid the use of style, script, and iframe tags
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'], // frobid the use of style, onerror, onload, and onclick attributes
  });
}

// function for sanitizing URLs
export function sanitizeUrl(url: string): string {
  const sanitized = DOMPurify.sanitize(url);
  const urlObject = new URL(sanitized, window.location.origin);
  
  // Allow only 'http:' and 'https:' protocols in URLs for security reasons
  if (!['http:', 'https:'].includes(urlObject.protocol)) {
    throw new Error('Invalid URL protocol');
  }
  
  return urlObject.toString(); // return the sanitized URL
}