import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

/**
 * Reusable error state component.
 * Props:
 *   message  — human-readable error string
 *   onRetry  — optional retry callback; shows Retry button when provided
 *   compact  — smaller variant for inline use inside cards
 */
const ErrorState = ({ message, onRetry, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive font-mono py-2">
        <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{message ?? "Failed to load data"}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Retry"
          >
            <FiRefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <FiAlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-mono font-bold text-foreground mb-1">
          Something went wrong
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {message ?? "Failed to load data. Check your connection and try again."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-xs font-body border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
