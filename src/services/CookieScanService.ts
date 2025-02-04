interface ScanResults {
    timestamp: string;
    cookies: string[];
    databases: IDBDatabaseInfo[];
    localStorage: Record<string, string>;
  }
  
// Return a list of cookies, databases, and localStorage items
export class CookieScanService {
    private static SCAN_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days scan intervall
    private static MAX_ITEMS = 20; // return max 20 items
    private static MAX_VALUE_LENGTH = 50; // reduce value length to 50 characters
    private static scanning = false; // scanning flag to prevent multiple scans
  
    // scan cookies, databases, and localStorage items
    static async scanCookies(): Promise<ScanResults> { 
      // return empty scan if already scanning
      if (this.scanning) {
        return this.getEmptyScan();
      }
      
      try {
        // set scanning flag to true
        this.scanning = true;
  
        // collect minimal cookie information
        const cookies = document.cookie.split(';')
          .map(cookie => cookie.trim())
          .filter(Boolean)
          .map(cookie => {
            const [name] = cookie.split('=');
            return name.trim(); // save only cookie name, not value for privacy reasons 
          })
          .slice(0, this.MAX_ITEMS);
  
        // collect minimal indexedDB information
        const databases = await window.indexedDB.databases();
        const databaseNames = databases
          .map(db => db.name)
          .filter(Boolean)
          .slice(0, this.MAX_ITEMS);
  
        // collect minimal localStorage information 
        const storageKeys = Object.keys(localStorage)
          .filter(key => key !== 'lastCookieScan') // exclude last scan data for privacy reasons 
          .slice(0, this.MAX_ITEMS);
  
        // create summary object with timestamp and statistics
        const summary = {
          timestamp: new Date().toISOString(),
          stats: {
            cookieCount: cookies.length,
            databaseCount: databaseNames.length,
            storageKeyCount: storageKeys.length
          },
          // save only the first 20 items for each category, and reduce value length. Do not save values for cookies names for privacy reasons
          items: {
            cookies,
            databases: databaseNames,
            storageKeys
          }
        };
        
        // save scan results to localStorage
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
        // convert summary object to string and check size
        const dataString = JSON.stringify(summary);
        const dataSize = new Blob([dataString]).size;
  
        if (dataSize > 50000) { // 50KB max
          // if data is too large, save only timestamp and statistics for storage optimization 
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
  
    // this function expands the summary object to full scan results by fetching the actual cookie, database, and localStorage values
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
  
    // this function returns an empty scan result object with only timestamp for privacy reasons 
    private static getEmptyScan(): ScanResults {
      return {
        timestamp: new Date().toISOString(),
        cookies: [],
        databases: [],
        localStorage: {}
      };
    }
  
    // start periodic scanning with initial delay and interval 
    static startPeriodicScanning(): () => void {
      if (typeof window === 'undefined') return () => {};
  
      // clear old scan data
      localStorage.removeItem('lastCookieScan');
      
      // Initial scan with delay 
      const timeoutId = setTimeout(() => {
        if (!this.scanning) {
          this.scanCookies();
        }
      }, 5000);
  
      // periodic scan with interval 
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
  
    // stop scanning by setting scanning flag to false 
    static stopScanning(): void {
      this.scanning = false;
    }
  }