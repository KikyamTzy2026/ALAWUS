import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ALAW US crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <div className="panel" style={{ maxWidth: 520, textAlign: 'center' }}>
            <h2 className="title-font" style={{ marginTop: 0, color: '#e0393e' }}>
              SOMETHING WENT WRONG
            </h2>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>
              ALAW US hit an unexpected error and had to stop. The technical detail
              below is safe to copy and share for debugging:
            </p>
            <pre
              style={{
                textAlign: 'left',
                background: '#0a0f19',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                overflowX: 'auto',
                marginBottom: 18,
                color: '#e6ebf5'
              }}
            >
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button className="btn full" onClick={this.handleReload}>
              RELOAD ALAW US
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
