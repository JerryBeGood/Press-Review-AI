import type { APIRoute } from "astro";

import { LeadAgent } from "../../agents/lead.js";
import { validateSecrets, escapeHtml } from "../../util.js";

export const GET: APIRoute = async ({url}) => {
  try {
    validateSecrets();

    const subject: string = url.searchParams.get("subject") || 'ai engineering';
    const leadAgent: LeadAgent = new LeadAgent();
    const pressReview: Array<Object> = await leadAgent.run(subject);

    return new Response(JSON.stringify(pressReview), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Failed to fetch press review",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};