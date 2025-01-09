interface ScanResults {
    timestamp: string;
    cookies: string[];
    databases: IDBDatabaseInfo[];
    localStorage: Record<string, string>;
  }
  
// src/services/CookieScanService.ts

export class CookieScanService {
    private static SCAN_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 dagar
    private static MAX_ITEMS = 20; // Begränsa antalet items vi sparar
    private static MAX_VALUE_LENGTH = 50; // Begränsa längden på varje värde
    private static scanning = false;
  
    static async scanCookies(): Promise<ScanResults> {
      if (this.scanning) {
        return this.getEmptyScan();
      }
  
      try {
        this.scanning = true;
  
        // Samla bara väsentlig cookie-information
        const cookies = document.cookie.split(';')
          .map(cookie => cookie.trim())
          .filter(Boolean)
          .map(cookie => {
            const [name] = cookie.split('=');
            return name.trim(); // Spara bara cookie-namnet, inte värdet
          })
          .slice(0, this.MAX_ITEMS);
  
        // Samla minimal databas-information
        const databases = await window.indexedDB.databases();
        const databaseNames = databases
          .map(db => db.name)
          .filter(Boolean)
          .slice(0, this.MAX_ITEMS);
  
        // Samla minimal localStorage-information
        const storageKeys = Object.keys(localStorage)
          .filter(key => key !== 'lastCookieScan') // Exkludera vår egen scan
          .slice(0, this.MAX_ITEMS);
  
        const summary = {
          timestamp: new Date().toISOString(),
          stats: {
            cookieCount: cookies.length,
            databaseCount: databaseNames.length,
            storageKeyCount: storageKeys.length
          },
          // Spara bara namnen, inte värdena
          items: {
            cookies,
            databases: databaseNames,
            storageKeys
          }
        };
  
        await this.saveScanResults(summary);
        return this.expandSummaryToFullResults(summary);
  
      } catch (error) {
        console.warn('Scan failed:', error);
        return this.getEmptyScan();
      } finally {
        this.scanning = false;
      }
    }
  
    private static async saveScanResults(summary: any): Promise<void> {
      try {
        // Konvertera till string och kontrollera storlek
        const dataString = JSON.stringify(summary);
        const dataSize = new Blob([dataString]).size;
  
        if (dataSize > 50000) { // 50KB max
          // Om för stor, spara bara statistik
          const miniSummary = {
            timestamp: summary.timestamp,
            stats: summary.stats
          };
          localStorage.setItem('lastCookieScan', JSON.stringify(miniSummary));
        } else {
          localStorage.setItem('lastCookieScan', dataString);
        }
      } catch (error) {
        console.warn('Failed to save scan results, clearing old data:', error);
        localStorage.removeItem('lastCookieScan');
      }
    }
  
    private static expandSummaryToFullResults(summary: any): ScanResults {
      return {
        timestamp: summary.timestamp,
        cookies: summary.items?.cookies || [],
        databases: summary.items?.databases.map((name: string) => ({ name })) || [],
        localStorage: summary.items?.storageKeys.reduce((acc: any, key: string) => {
          acc[key] = 'Value hidden for storage optimization';
          return acc;
        }, {})
      };
    }
  
    private static getEmptyScan(): ScanResults {
      return {
        timestamp: new Date().toISOString(),
        cookies: [],
        databases: [],
        localStorage: {}
      };
    }
  
    static startPeriodicScanning(): () => void {
      if (typeof window === 'undefined') return () => {};
  
      // Rensa gammal data först
      localStorage.removeItem('lastCookieScan');
      
      // Initial scan med fördröjning
      const timeoutId = setTimeout(() => {
        if (!this.scanning) {
          this.scanCookies();
        }
      }, 5000);
  
      // Periodisk scanning med längre intervall
      const intervalId = setInterval(() => {
        if (!this.scanning) {
          this.scanCookies();
        }
      }, this.SCAN_INTERVAL);
  
      // Cleanup funktion
      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        this.scanning = false;
      };
    }
  
    static stopScanning(): void {
      this.scanning = false;
    }
  }