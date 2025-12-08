import { ServiceError, type ServiceErrorCode } from "./errors";

/**
 * Maps a ServiceError to an HTTP status code
 */
function getStatusCode(code: ServiceErrorCode): number {
  const statusMap: Record<ServiceErrorCode, number> = {
    LIMIT_EXCEEDED: 429, // Too Many Requests
    GENERATION_LIMIT_EXCEEDED: 429, // Too Many Requests
    DUPLICATE_TOPIC: 409, // Conflict
    NOT_FOUND: 404, // Not Found
    CONFLICT: 409, // Conflict
    DATABASE_ERROR: 500, // Internal Server Error
    SCHEDULING_ERROR: 500, // Internal Server Error
    UNSCHEDULING_ERROR: 500, // Internal Server Error
  };

  return statusMap[code] || 500;
}

/**
 * Maps a ServiceError to a user-friendly message
 */
function getUserMessage(code: ServiceErrorCode, serviceMessage?: string): string {
  const messageMap: Record<ServiceErrorCode, string> = {
    LIMIT_EXCEEDED: "Cannot schedule more than 5 press reviews",
    GENERATION_LIMIT_EXCEEDED: "Generation limit reached (5/5)",
    DUPLICATE_TOPIC: "Press review with the same topic already exists",
    NOT_FOUND: "Resource not found",
    CONFLICT: "A conflicting operation is already in progress",
    DATABASE_ERROR: "Database error occurred",
    SCHEDULING_ERROR: "Failed to schedule press review generation",
    UNSCHEDULING_ERROR: "Failed to unschedule press review generation",
  };

  // Use the service message if available, otherwise use the default
  return messageMap[code] ?? serviceMessage ?? "Unknown error";
}

/**
 * Converts a ServiceError into an HTTP Response
 *
 * Usage:
 * ```typescript
 * try {
 *   const result = await service.someMethod();
 *   return new Response(JSON.stringify(result), { status: 200 });
 * } catch (error) {
 *   return handleServiceError(error);
 * }
 * ```
 *
 * @param error - The error to handle (ServiceError or unknown)
 * @returns HTTP Response with appropriate status code and error message
 */
export function handleServiceError(error: unknown): Response {
  // Handle ServiceError instances
  if (ServiceError.isServiceError(error)) {
    const statusCode = getStatusCode(error.code);
    const message = getUserMessage(error.code, error.message);

    // Log server errors (5xx) for debugging
    if (statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(`[ServiceError] ${error.code}:`, error.originalError || error);
    }

    return new Response(
      JSON.stringify({
        message,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle unexpected errors
  // eslint-disable-next-line no-console
  console.error("[Unexpected Error]:", error);

  return new Response(
    JSON.stringify({
      message: "Internal server error",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
