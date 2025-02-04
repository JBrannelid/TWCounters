import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { User } from 'firebase/auth';

// AnalyticsService class to handle all analytics events and user properties in the app using Firebase Analytics SDK 
export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private analytics: ReturnType<typeof getAnalytics> | null = null;
  private initialized: boolean = false;

  private constructor(app: FirebaseApp) {
    try {
      // Initialize Firebase Analytics if not already initialized
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const analyticsConfig = {
          config: {
            measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
          }
        };
        // Initialize Firebase Analytics with the app instance and set initialized flag to true if successful 
        this.analytics = getAnalytics(app);
        this.initialized = true;
      } else {
        this.initialized = false; // set initialized flag to false if not in production or missing measurementId with warning
        console.warn('Analytics not initialized - development mode or missing measurementId');
      }
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      this.initialized = false;
    }
  }

  // Initialize the AnalyticsService with a Firebase app instance and return the instance 
  public static initialize(app: FirebaseApp): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(app);
    }
    return AnalyticsService.instance;
  }

  // Get the existing instance of AnalyticsService or return a dummy instance if not initialized
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      console.warn('Analytics not initialized, returning dummy instance');
      // Return dummy instance instead of throwing error
      return new class extends AnalyticsService {
        constructor() {
          super(null as unknown as FirebaseApp);
        }
      };
    }
    return AnalyticsService.instance;
  }

  // Private method to check if analytics is initialized and available 
  private ensureInitialized(): boolean {
    if (!this.initialized || !this.analytics) {
      return false;
    }
    return true;
  }

  // Existing methods with safety checks to log analytics events and user properties
  public logPageView(pageName: string, additionalParams?: Record<string, any>): void {
    if (!this.ensureInitialized()) return;

    try {
      logEvent(this.analytics!, 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalParams
      });
    } catch (error) {
      console.warn('Failed to log page view:', error);
    }
  }

  // log user interactions with action name and optional parameters 
  public logUserInteraction(actionName: string, actionParams?: Record<string, any>): void {
    if (!this.ensureInitialized()) return;

    try {
      // Log user interaction event with action name and additional parameters if available 
      logEvent(this.analytics!, 'user_interaction', {
        action_name: actionName,
        ...actionParams
      });
    } catch (error) {
      console.warn('Failed to log user interaction:', error);
    }
  }

  // Keep all existing analytics methods
  public logVisitorInfo(): void {
    // Check if analytics is initialized before logging visitor info
    if (!this.ensureInitialized()) return;

    try {
      // Log visitor info with browser language, user agent, screen resolution, timezone, and session start time
      logEvent(this.analytics!, 'visitor_info', {
        language: navigator.language,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        sessionStart: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log visitor info:', error);
    }
  }

  // Log performance metrics like DNS time, connection time, TTFB, DOM load time, full page load, and paint timings
  public logPerformanceMetrics(): void {
    if (!this.ensureInitialized()) return;

    try {
      // Check if performance API is available in the browser
      if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintTiming = performance.getEntriesByType('paint');
        
        // Log performance metrics 
        const metrics = {
          dns_time: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
          connection_time: navigationTiming.connectEnd - navigationTiming.connectStart,
          ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
          dom_load_time: navigationTiming.domContentLoadedEventEnd - navigationTiming.responseEnd,
          full_page_load: navigationTiming.loadEventEnd - navigationTiming.startTime,
          first_paint: paintTiming.find(entry => entry.name === 'first-paint')?.startTime,
          first_contentful_paint: paintTiming.find(entry => entry.name === 'first-contentful-paint')?.startTime
        };

        logEvent(this.analytics!, 'performance_metrics', metrics);
      }
    } catch (error) {
      console.warn('Failed to log performance metrics:', error);
    }
  }

  // Log resource metrics like resource name, duration, transfer size, and initiator type
  public logResourceMetrics(): void {
    if (!this.ensureInitialized()) return;

    try {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource');
        
        const resourceMetrics = resources
          .filter((resource): resource is PerformanceResourceTiming => 
            resource instanceof PerformanceResourceTiming
          )
          .map(resource => ({
            name: resource.name,
            duration: resource.duration,
            transfer_size: resource.transferSize,
            initiator_type: resource.initiatorType
          }));

        logEvent(this.analytics!, 'resource_metrics', {
          resource_count: resources.length,
          total_transfer_size: resourceMetrics.reduce((acc, curr) => acc + curr.transfer_size, 0),
          resources: resourceMetrics.slice(0, 10)
        });
      }
    } catch (error) {
      console.warn('Failed to log resource metrics:', error);
    }
  }

  // Log session data with session ID, start time, referrer, landing page, user agent, viewport size, device memory, and connection type
  public logSessionData(): void {
    if (!this.ensureInitialized()) return;

    try {
      const sessionData = {
        session_id: Date.now().toString(),
        start_time: new Date().toISOString(),
        referrer: document.referrer,
        landing_page: window.location.pathname,
        user_agent: navigator.userAgent,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        device_memory: (navigator as any).deviceMemory,
        connection_type: (navigator as any).connection?.effectiveType
      };

      logEvent(this.analytics!, 'session_data', sessionData);
    } catch (error) {
      console.warn('Failed to log session data:', error);
    }
  }

  // Log app performance with load time and component name (default to 'app' if not provided)
  public logAppPerformance(loadTime: number, componentName?: string): void {
    if (!this.ensureInitialized()) return;

    try {
      logEvent(this.analytics!, 'app_performance', {
        load_time: loadTime,
        component: componentName || 'app'
      });
    } catch (error) {
      console.warn('Failed to log app performance:', error);
    }
  }

  // Log error events with error message, stack trace, and error
  public setUserProperties(user: User | null): void {
    if (!this.ensureInitialized() || !user) return;

    try {
      const properties = {
        user_id: user.uid,
        email_verified: user.emailVerified,
        created_at: user.metadata.creationTime,
        last_login: user.metadata.lastSignInTime
      };

      Object.entries(properties).forEach(([key, value]) => {
        setUserProperties(this.analytics!, { [key]: value });
      });
    } catch (error) {
      console.warn('Failed to set user properties:', error);
    }
  }

  // Helper method to check if analytics is available and initialized 
  public isAvailable(): boolean {
    return this.initialized && this.analytics !== null;
  }
}