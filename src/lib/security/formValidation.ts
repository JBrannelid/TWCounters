// Skapa en ny fil: src/lib/formValidation.ts

import { sanitizeInput, sanitizeHTML, sanitizeUrl, sanitizeSearchQuery } from './Sanitizer';

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
}

export function validateAndSanitizeFormField(
  value: string | null | undefined,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowHTML?: boolean;
    isUrl?: boolean;
    isSearch?: boolean;
  } = {}
): ValidationResult {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    allowHTML = false,
    isUrl = false,
    isSearch = false
  } = options;

  // Hantera tomt värde
  if (!value) {
    if (required) {
      return {
        isValid: false,
        sanitizedValue: '',
        error: `${fieldName} is required`
      };
    }
    return {
      isValid: true,
      sanitizedValue: ''
    };
  }

  // Välj rätt sanitering baserat på fälttyp
  let sanitizedValue = '';
  if (isUrl) {
    sanitizedValue = sanitizeUrl(value);
  } else if (isSearch) {
    sanitizedValue = sanitizeSearchQuery(value);
  } else if (allowHTML) {
    sanitizedValue = sanitizeHTML(value);
  } else {
    sanitizedValue = sanitizeInput(value);
  }

  // Validera längd
  if (sanitizedValue.length < minLength) {
    return {
      isValid: false,
      sanitizedValue,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (sanitizedValue.length > maxLength) {
    return {
      isValid: false,
      sanitizedValue,
      error: `${fieldName} must be no more than ${maxLength} characters`
    };
  }

  // URL-specifik validering
  if (isUrl && !sanitizedValue && value) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Invalid URL format'
    };
  }

  return {
    isValid: true,
    sanitizedValue
  };
}