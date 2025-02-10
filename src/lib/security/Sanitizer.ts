import DOMPurify from 'dompurify';

// function for sanitizing user input - remove all HTML tags and special characters
export function sanitizeInput(input: string): string {
  // Ensure input is a string
  if (typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // strip all HTML tags
    ALLOWED_ATTR: [], // strip all attributes
    FORBID_TAGS: ['style', 'script', 'iframe'], 
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick']
  });
}

// Sanitize HTML content but allow basic formatting
export function sanitizeHTML(html: string | null | undefined): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    SANITIZE_DOM: true
  }).trim();
}

// function for sanitizing URLs
export function sanitizeUrl(url: string): string {
  try {
    // Ensure input is a string
    if (typeof url !== 'string') {
      throw new Error('Invalid URL type');
    }

    const sanitized = DOMPurify.sanitize(url);
    const urlObject = new URL(sanitized, window.location.origin);
    
    // Allow only http: and https: protocols
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    
    return urlObject.toString();
  } catch (error) {
    console.error('URL sanitization error:', error);
    return ''; // Return empty string for invalid URLs
  }
}

// Sanitize search queries
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';
  
  return sanitizeInput(query)
    .replace(/[^\w\s-]/g, '') // Only allow letters, numbers, spaces, and hyphens
    .trim();
}

// Sanitize filenames
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return '';
  
  return sanitizeInput(fileName)
    .replace(/[^\w\s-\.]/g, '') // Only allow letters, numbers, spaces, hyphens, and dots
    .trim();
}

// Sanitize numeric input
export function sanitizeNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null;
  
  const cleaned = String(input).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

// Validate and sanitize email addresses
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const sanitized = sanitizeInput(email).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}