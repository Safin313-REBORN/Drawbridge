import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected application error.",
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="card" style={{ padding: 28, boxShadow: "var(--shadow-md)" }}>
            <div className="lab" style={{ color: "var(--sigt)" }}>
              Runtime error
            </div>
            <h1 className="disp" style={{ fontSize: 48, marginTop: 8 }}>
              Something went wrong
            </h1>
            <p style={{ margin: "16px 0 24px" }}>{this.state.message}</p>
            <button
              type="button"
              className="btn btn-p"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
