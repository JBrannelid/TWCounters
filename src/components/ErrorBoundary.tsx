import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ErrorBoundary component that catches errors in the component tree and displays a fallback UI
// user-friendly error message that does not crash the entire application
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// State for ErrorBoundary component
interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Catch errors in the component tree and update state
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Log error to console
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  // Reset error state
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  // Refresh the page
  private handleRefresh = () => {
    window.location.reload();
  };

  // Render fallback UI if error occurred
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-sans text-red-400 mb-2">
                  Application Error
                </h3>
                <p className="text-sm font-sans text-red-400/80 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;