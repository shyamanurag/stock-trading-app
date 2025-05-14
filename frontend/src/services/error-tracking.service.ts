// frontend/src/services/error-tracking.service.ts
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

class ErrorTrackingService {
  private initialized = false;

  init(dsn: string, environment: string, release: string): void {
    if (this.initialized) {
      console.warn('Error tracking service already initialized');
      return;
    }

    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });

    this.initialized = true;
    console.log(`Error tracking initialized for ${environment}`);
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('Error tracking service not initialized');
      console.error(error);
      return;
    }

    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.Severity = Sentry.Severity.Info): void {
    if (!this.initialized) {
      console.warn('Error tracking service not initialized');
      console.log(message);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      console.warn('Error tracking service not initialized');
      return;
    }

    Sentry.setUser(user);
  }

  clearUser(): void {
    if (!this.initialized) {
      console.warn('Error tracking service not initialized');
      return;
    }

    Sentry.configureScope(scope => scope.setUser(null));
  }
}

export const errorTrackingService = new ErrorTrackingService();
