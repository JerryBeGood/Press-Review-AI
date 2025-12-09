import type { APIRoute } from "astro";
import { ProfileService } from "../../lib/services/profileService";
import { handleServiceError } from "../../lib/apiErrorHandler";

export const GET: APIRoute = async ({ locals }) => {
  // Step 1: Verify authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const profileService = new ProfileService(locals.supabase);
    const quotaInfo = await profileService.getQuotaInfo(locals.user.id);

    return new Response(JSON.stringify(quotaInfo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};
