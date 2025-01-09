import { CookieConsentData } from './CookieConsentTypes';
import { CookieScanService } from '@/services/CookieScanService';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

export class CookieManager {
  private static CONSENT_KEY = 'cookie_consent_state';

  // Hämta sparade cookie-inställningar
  static getStoredConsent(): CookieConsentData | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Spara cookie-inställningar
  static setConsent(consent: CookieConsentData): void {
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));

    // Uppdatera cookies baserat på samtycke
    this.updateCookiesBasedOnConsent(consent);
  }

  // Rensa cookie-inställningar
  static clearConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    this.deleteNonEssentialCookies();
  }

  // Kontrollera samtycke för en specifik kategori
  static hasConsent(category: keyof CookieConsentData): boolean {
    const consent = this.getStoredConsent();
    return consent ? Boolean(consent[category]) : false;
  }

  // Skanna efter existerande cookies
  static scanCookies(): { [key: string]: any } {
    const cookies: { [key: string]: any } = {};
    
    // Scanna cookies
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(s => s.trim());
      if (name) cookies[name] = value;
    });

    // Scanna localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        cookies[key] = localStorage.getItem(key);
      }
    }

    // Scanna sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        cookies[key] = sessionStorage.getItem(key);
      }
    }

    return cookies;
  }

  // Generera privacy rapport
  static async generatePrivacyReport(): Promise<string> {
    try {
      const scan = await CookieScanService.scanCookies();
      return JSON.stringify(scan, null, 2);
    } catch (error) {
      console.error('Failed to generate privacy report:', error);
      return JSON.stringify({ error: 'Failed to generate report' });
    }
  }

  // Ta bort icke-nödvändiga cookies
  static deleteNonEssentialCookies(): void {
    const cookies = this.scanCookies();
    Object.keys(cookies).forEach(name => {
      if (!this.isEssentialCookie(name)) {
        this.deleteCookie(name);
      }
    });
  }

  // Uppdatera cookies baserat på samtycke
  private static updateCookiesBasedOnConsent(consent: CookieConsentData): void {
    // Om nödvändiga cookies inte är accepterade, ta bort alla förutom consent-cookie
    if (!consent.necessary) {
      this.deleteNonEssentialCookies();
      return;
    }

    // Hantera övriga cookie-kategorier
    const cookies = this.scanCookies();
    Object.keys(cookies).forEach(name => {
      const category = this.getCookieCategory(name);
      if (category && !consent[category as keyof CookieConsentData]) {
        this.deleteCookie(name);
      }
    });

    // Rensa IndexedDB om nödvändigt
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

  // Kontrollera om en cookie är nödvändig
  private static isEssentialCookie(name: string): boolean {
    const essentialCookies = [
      this.CONSENT_KEY,
      'firebase-heartbeat-database',
      'theme'
    ];
    return essentialCookies.includes(name);
  }

  // Kontrollera om en databas är nödvändig
  private static isEssentialDatabase(name: string): boolean {
    return [
      'firebase-heartbeat-database',
      'CookieConsent'
    ].includes(name);
  }

  // Kontrollera om localStorage är nödvändig
  private static isEssentialStorage(key: string): boolean {
    return [
      this.CONSENT_KEY,
      'theme',
      'firebase-heartbeat-database'
    ].includes(key);
  }

  // Ta bort en cookie
  private static deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn(`Failed to remove ${name} from localStorage:`, e);
    }
    
    try {
      sessionStorage.removeItem(name);
    } catch (e) {
      console.warn(`Failed to remove ${name} from sessionStorage:`, e);
    }
  }

  // Validera samtycke
  static validateConsent(consent: CookieConsentData): boolean {
    return (
      typeof consent.necessary === 'boolean' &&
      typeof consent.preferences === 'boolean' &&
      typeof consent.analytics === 'boolean' &&
      typeof consent.marketing === 'boolean' &&
      typeof consent.timestamp === 'string'
    );
  }
    // Add this method
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