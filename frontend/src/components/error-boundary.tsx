import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = PropsWithChildren<{
  fallback?: ReactNode;
}>;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-card">
            <p className="eyebrow">Error inesperado</p>
            <h2>Algo sali&oacute; mal al cargar esta secci&oacute;n</h2>
            <p>
              La aplicaci&oacute;n encontr&oacute; un error al intentar mostrar el contenido.
              Puedes intentar recargar la p&aacute;gina.
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Detalles t&eacute;cnicos</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button className="primary-button" type="button" onClick={() => window.location.reload()}>
                Recargar p&aacute;gina
              </button>
              <button className="ghost-button" type="button" onClick={this.handleReset}>
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
