import type { GenerationStatus } from "./types.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
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
  const now = new Date();
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

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  return startDate.toISOString();
}
