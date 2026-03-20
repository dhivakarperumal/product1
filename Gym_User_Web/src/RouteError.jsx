import { useRouteError, isRouteErrorResponse } from "react-router-dom";

const RouteError = () => {
  const error = useRouteError();
  console.error("Route error:", error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6 py-10">
      <div className="max-w-2xl w-full bg-gray-900 border border-red-500/40 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-red-400 mb-3">Oops! Something went wrong</h1>
        <p className="text-sm text-gray-300 mb-4">
          We could not load this page. Please refresh or contact support.
        </p>

        {isRouteErrorResponse(error) ? (
          <div className="text-xs text-gray-300">
            <p>Status: {error.status}</p>
            <p>Message: {error.statusText || error.error?.message || "An unexpected error occurred"}</p>
          </div>
        ) : (
          <pre className="text-xs text-red-200 bg-black/20 rounded p-2 max-h-48 overflow-auto">
            {String(error?.message || error)}
          </pre>
        )}

        <div className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
