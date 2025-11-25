/**
 * Standardized error codes for service layer
 * These codes represent business logic failures and database constraints
 */
export type ServiceErrorCode =
  | "LIMIT_EXCEEDED" // User has reached the limit of resources (e.g., 5 press reviews)
  | "DUPLICATE_TOPIC" // Topic already exists for this user
  | "NOT_FOUND" // Resource not found or user doesn't have access
  | "CONFLICT" // Resource conflict (e.g., pending generation already exists)
  | "DATABASE_ERROR" // Unexpected database error
  | "SCHEDULING_ERROR" // Error scheduling cron job
  | "UNSCHEDULING_ERROR"; // Error unscheduling cron job

/**
 * Service-layer error class for domain-specific errors
 *
 * Usage:
 * ```typescript
 * throw new ServiceError("NOT_FOUND", "Press review not found");
 * ```
 *
 * The error code can be used in API endpoints to return appropriate HTTP status codes:
 * - LIMIT_EXCEEDED → 429 Too Many Requests
 * - DUPLICATE_TOPIC → 409 Conflict
 * - NOT_FOUND → 404 Not Found
 * - CONFLICT → 409 Conflict
 * - DATABASE_ERROR → 500 Internal Server Error
 * - SCHEDULING_ERROR → 500 Internal Server Error
 * - UNSCHEDULING_ERROR → 500 Internal Server Error
 */
export class ServiceError extends Error {
  /**
   * @param code - Standardized error code for the failure type
   * @param message - Optional human-readable error message (defaults to code)
   * @param originalError - Optional original error object for debugging
   */
  constructor(
    public readonly code: ServiceErrorCode,
    message?: string,
    public readonly originalError?: unknown
  ) {
    super(message || code);
    this.name = "ServiceError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }

  /**
   * Helper to check if an error is a ServiceError with a specific code
   */
  static isServiceError(error: unknown, code?: ServiceErrorCode): error is ServiceError {
    if (!(error instanceof ServiceError)) {
      return false;
    }
    return code ? error.code === code : true;
  }

  /**
   * Convert error to a plain object for logging or serialization
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      originalError: this.originalError instanceof Error ? this.originalError.message : this.originalError,
    };
  }
}
