import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Plantasia Engine Test] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="boot-panel" style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Plantasia failed to load</h1>
          <p style={{ margin: '0 0 0.75rem', opacity: 0.9 }}>{this.state.error.message}</p>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '0.875rem' }}>
            Check the browser console for details, then refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
