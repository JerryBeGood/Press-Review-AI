import type { GenerationStatus } from "./types.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

/**
 * Verifies that the incoming request is authenticated with the edge function auth key
 * @param request The incoming HTTP request
 * @returns Response with 401 if unauthorized, null if authorized
 */
export function verifyAuth(request: Request): Response | null {
  const authHeader = request.headers.get("Authorization");
  const edgeFuncAuthKey = Deno.env.get("EDGE_FUNC_AUTH_KEY");

  if (!edgeFuncAuthKey) {
    // eslint-disable-next-line no-console
    console.error("EDGE_FUNC_AUTH_KEY is not configured");
    return errorResponse("Server configuration error", 500);
  }

  if (!authHeader) {
    return errorResponse("Missing Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== edgeFuncAuthKey) {
    return errorResponse("Unauthorized", 401);
  }

  return null;
}

export async function updateGenerationStatus(
  supabase: SupabaseClient,
  generatedPressReviewId: string,
  status: GenerationStatus,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (error) {
    updateData.error = error;
  }

  const { error: updateError } = await supabase
    .from("generated_press_reviews")
    .update(updateData)
    .eq("id", generatedPressReviewId);

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error(`Failed to update ${generatedPressReviewId} status to ${status}:`, updateError);
    throw updateError;
  }
}

export async function invokeEdgeFunction(functionName: string, payload: Record<string, unknown>): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const edgeFuncAuthKey = Deno.env.get("EDGE_FUNC_AUTH_KEY");

  if (!supabaseUrl || !edgeFuncAuthKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${edgeFuncAuthKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to invoke ${functionName}: ${errorText}`);
  }
}

export function errorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function successResponse(message: string, data?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      ...data,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function calculateStartPublishedDate(cronSchedule: string): string {
  const startDate = new Date();
  let days = 1;

  const cronParts = cronSchedule.trim().split(/\s+/);
  if (cronParts.length === 5) {
    const isMonthly = cronParts[2] !== "*";
    const isWeekly = cronParts[4] !== "*";

    if (isMonthly) {
      days = 30;
    } else if (isWeekly) {
      days = 7;
    }
  }

  startDate.setDate(startDate.getDate() - days);

  return startDate.toISOString();
}

export async function processConcurrently<T, R>(items: T[], fn: (item: T) => Promise<R>, limit: number): Promise<R[]> {
  const results: R[] = [];

  for (let start = 0; start < items.length; start += limit) {
    const chunk = items.slice(start, start + limit);
    const chunkResults = await Promise.allSettled(chunk.map((item) => fn(item)));

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
}

/**
 * Creates a logger instance with prefixed messages for better traceability
 * @param reviewId - The generated_press_review_id to use as prefix
 * @returns Logger object with log and error methods
 */
export function createLogger(reviewId: string) {
  const prefix = `[${reviewId}]`;

  return {
    log: (...args: unknown[]) => console.log(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}
