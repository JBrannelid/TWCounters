// src/services/analyticsService.ts

import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { User } from 'firebase/auth';

export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private analytics: ReturnType<typeof getAnalytics> | null = null;
  private initialized: boolean = false;

  private constructor(app: FirebaseApp) {
    try {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const analyticsConfig = {
          config: {
            measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
          }
        };
        this.analytics = getAnalytics(app);
        this.initialized = true;
      } else {
        this.initialized = false;
        console.warn('Analytics not initialized - development mode or missing measurementId');
      }
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      this.initialized = false;
    }
  }

  public static initialize(app: FirebaseApp): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(app);
    }
    return AnalyticsService.instance;
  }

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

  private ensureInitialized(): boolean {
    if (!this.initialized || !this.analytics) {
      return false;
    }
    return true;
  }

  // Existing methods with safety checks
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

  public logUserInteraction(actionName: string, actionParams?: Record<string, any>): void {
    if (!this.ensureInitialized()) return;

    try {
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
    if (!this.ensureInitialized()) return;

    try {
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

  public logPerformanceMetrics(): void {
    if (!this.ensureInitialized()) return;

    try {
      if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintTiming = performance.getEntriesByType('paint');
        
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

  // Helper method to check if analytics is available
  public isAvailable(): boolean {
    return this.initialized && this.analytics !== null;
  }
}