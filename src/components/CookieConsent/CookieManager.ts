import { CookieConsentData } from './CookieConsentTypes';
import { CookieScanService } from '@/services/CookieScanService';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

export class CookieManager {
  private static CONSENT_KEY = 'cookie_consent_state';

  // Fetch cookie-consent from localStorage 
  static getStoredConsent(): CookieConsentData | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // save cookie-settings
  static setConsent(consent: CookieConsentData): void {
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));

    // update cookies base on consent  
    this.updateCookiesBasedOnConsent(consent);
  }

  // Clean cookie-settings
  static clearConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    this.deleteNonEssentialCookies();
  }

  // Check consent for a specific category
  static hasConsent(category: keyof CookieConsentData): boolean {
    const consent = this.getStoredConsent();
    return consent ? Boolean(consent[category]) : false;
  }

  // scan after existing cookies
  static scanCookies(): { [key: string]: any } {
    const cookies: { [key: string]: any } = {};
    
    // Scann cookies
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(s => s.trim());
      if (name) cookies[name] = value;
    });

    // Scann localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        cookies[key] = localStorage.getItem(key);
      }
    }

    // Scann sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        cookies[key] = sessionStorage.getItem(key);
      }
    }

    return cookies;
  }

  // Generate privacy repports
  static async generatePrivacyReport(): Promise<string> {
    try {
      const scan = await CookieScanService.scanCookies();
      return JSON.stringify(scan, null, 2);
    } catch (error) {
      console.error('Failed to generate privacy report:', error);
      return JSON.stringify({ error: 'Failed to generate report' });
    }
  }

  // Remove non-essential cookies
  static deleteNonEssentialCookies(): void {
    const cookies = this.scanCookies();
    Object.keys(cookies).forEach(name => {
      if (!this.isEssentialCookie(name)) {
        this.deleteCookie(name);
      }
    });
  }

  // Uppdate cookies based on consent
  private static updateCookiesBasedOnConsent(consent: CookieConsentData): void {
    // if necessary cookies are not allowed, delete all non-essential cookies
    if (!consent.necessary) {
      this.deleteNonEssentialCookies();
      return;
    }

    // handle cookies based on category consent and cookie mappings as needed 
    const cookies = this.scanCookies();
    Object.keys(cookies).forEach(name => {
      const category = this.getCookieCategory(name);
      if (category && !consent[category as keyof CookieConsentData]) {
        this.deleteCookie(name);
      }
    });

    // Clear all non-essential databases if preferences are not allowed
    if (!consent.preferences) {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name && !this.isEssentialDatabase(db.name)) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
  }

  // Check if cookie is necessary
  private static isEssentialCookie(name: string): boolean {
    const essentialCookies = [
      this.CONSENT_KEY,
      'firebase-heartbeat-database',
      'theme'
    ];
    return essentialCookies.includes(name);
  }

  // Check id db is necessary
  private static isEssentialDatabase(name: string): boolean {
    return [
      'firebase-heartbeat-database',
      'CookieConsent'
    ].includes(name);
  }

  // Check if local storage is necessary
  private static isEssentialStorage(key: string): boolean {
    return [
      this.CONSENT_KEY,
      'theme',
      'firebase-heartbeat-database'
    ].includes(key);
  }

  // Remove a cookie
  private static deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    
    // Remove from localStorage and sessionStorage
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn(`Failed to remove ${name} from localStorage:`, e);
    }
    
    // Remove from sessionStorage
    try {
      sessionStorage.removeItem(name);
    } catch (e) {
      console.warn(`Failed to remove ${name} from sessionStorage:`, e);
    }
  }

  // validate consent
  static validateConsent(consent: CookieConsentData): boolean {
    return (
      typeof consent.necessary === 'boolean' &&
      typeof consent.preferences === 'boolean' &&
      typeof consent.analytics === 'boolean' &&
      typeof consent.marketing === 'boolean' &&
      typeof consent.timestamp === 'string'
    );
  }
    // Get cookie category
    private static getCookieCategory(cookieName: string): keyof CookieConsentData | null {
      for (const category of COOKIE_CATEGORIES) {
        const cookieNames = category.cookies.map(cookie => cookie.name);
        if (cookieNames.includes(cookieName)) {
          return category.id as keyof CookieConsentData;
        }
      }
      
      // Default mappings for known cookies that might not be in categories
      const cookieMappings: { [key: string]: keyof CookieConsentData } = {
        'CookieConsent': 'necessary',
        'firebase-heartbeat-database': 'necessary',
        'theme': 'necessary',
        'firebaseLocalStorageDb': 'preferences',
        'firestore_clients': 'preferences'
      };
  
      return cookieMappings[cookieName] || null;
    }
}