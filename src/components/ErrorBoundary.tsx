import { Component, type ErrorInfo, type ReactNode } from 'react';
import { STORAGE_KEY, BACKUP_KEY, CORRUPTED_KEY } from '../lib/storage/localStorage';
import { downloadTextFile } from '../lib/io/exportJson';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleExportDiagnostics = (): void => {
    const diagnosticPayload = {
      timestamp: new Date().toISOString(),
      errorMessage: this.state.error?.message,
      errorStack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      storageData: localStorage.getItem(STORAGE_KEY),
      backupData: localStorage.getItem(BACKUP_KEY),
      corruptedData: localStorage.getItem(CORRUPTED_KEY)
    };
    downloadTextFile(
      JSON.stringify(diagnosticPayload, null, 2),
      `curriculum-tool-recovery-${Date.now()}.json`,
      'application/json'
    );
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetState = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            maxWidth: '800px',
            margin: '4rem auto',
            padding: '2.5rem',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111111'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
              {this.props.fallbackTitle || 'Curriculum Tool Rendering Exception'}
            </h2>
          </div>

          <p style={{ color: '#555555', lineHeight: '1.6', fontSize: '0.95rem' }}>
            An unexpected error occurred while rendering the curriculum view. To safeguard your work, your local storage data has not been deleted.
          </p>

          {this.state.error && (
            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              margin: '1.5rem 0',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#991b1b',
              overflowX: 'auto'
            }}>
              <strong>Error:</strong> {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
            <button
              onClick={this.handleExportDiagnostics}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#ffffff',
                color: '#111111',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Export Recovery Diagnostics
            </button>
            <button
              onClick={this.handleResetState}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Clear Storage & Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
