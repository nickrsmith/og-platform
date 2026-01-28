import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '800px',
          margin: '50px auto',
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
        }}>
          <h1 style={{ color: '#d32f2f', marginTop: 0 }}>⚠️ Application Error</h1>
          <p>The application encountered an error. Please check the details below:</p>
          
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflow: 'auto',
          }}>
            <strong>Error:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
            
            {this.state.errorInfo && (
              <>
                <strong style={{ display: 'block', marginTop: '15px' }}>Stack Trace:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reload Page
          </button>
          
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
              Full Error Details
            </summary>
            <pre style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '10px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '400px',
            }}>
              {JSON.stringify({
                error: this.state.error?.message,
                stack: this.state.error?.stack,
                componentStack: this.state.errorInfo?.componentStack,
              }, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

