// src/lib/security/sanitizer.ts

import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Tillåt inga HTML-taggar
    ALLOWED_ATTR: [], // Tillåt inga HTML-attribut
  });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], // Begränsa till säkra taggar
    ALLOWED_ATTR: ['href'], // Begränsa till säkra attribut
    ALLOW_DATA_ATTR: false, // Tillåt inte data- attribut
    ADD_ATTR: ['target'], // Lägg till target="_blank" för länkar
    FORBID_TAGS: ['style', 'script', 'iframe'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}

// Funktion för att validera och sanitera URL:er
export function sanitizeUrl(url: string): string {
  const sanitized = DOMPurify.sanitize(url);
  const urlObject = new URL(sanitized, window.location.origin);
  
  // Tillåt endast vissa protokoll
  if (!['http:', 'https:'].includes(urlObject.protocol)) {
    throw new Error('Invalid URL protocol');
  }
  
  return urlObject.toString();
}