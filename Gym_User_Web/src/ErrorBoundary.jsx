import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="max-w-lg w-full bg-gray-900 border border-red-500 rounded-2xl p-6 shadow-lg">
            <h1 className="text-2xl font-bold mb-3 text-red-400">Something went wrong</h1>
            <p className="text-sm text-gray-300 mb-4">
              We ran into an unexpected issue while logging in. Please refresh the page or try again.
            </p>
            <pre className="max-h-40 overflow-auto text-xs text-rose-200 bg-black/20 p-2 rounded">
              {this.state.error?.toString()}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-semibold"
              >
                Reload
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
