import { Component } from "react";

/**
 * Fängt Render-Fehler in Kindern ab (try/catch um Function Components tut das nicht).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", marginBottom: 8 }}>Receipto — Anzeigefehler</h1>
          <p style={{ marginBottom: 12, color: "#7f1d1d" }}>
            Beim Rendern ist ein Fehler aufgetreten. Details siehe Konsole.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              background: "#fff",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #fecaca",
              color: "#450a0a",
            }}
          >
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
          <button
            type="button"
            style={{ marginTop: 16, padding: "8px 14px", cursor: "pointer" }}
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
