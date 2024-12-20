import { generateCSPString } from './src/lib/csp-config';

export function getDefaultHeaders(nonce) {
  const csp = generateCSPString(nonce).replace(/\s+/g, ' ').trim();
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}