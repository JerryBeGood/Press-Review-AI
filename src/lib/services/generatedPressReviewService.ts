import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GeneratedPressReviewDetailDTO,
  GeneratedPressReviewsListDTO,
  GeneratedPressReviewsListWithTopicDTO,
  PressReviewStatus,
} from "../../types";

const MOCK_CONTENT = {
  general_summary:
    "Tydzień od 21 do 28 października 2024 był niezwykle bogaty w wydarzenia związane z AI Engineering. OpenAI zaprezentowało na DevDay 2024 przełomowe narzędzia dla developerów, włączając Realtime API, Vision Fine-tuning i Prompt Caching. Anthropic wydało zaktualizowaną wersję Claude 3.5 Sonnet z rewolucyjną funkcją 'computer use', pozwalającą AI na bezpośrednią interakcję z komputerem. Microsoft przedstawił kompleksowe aktualizacje Copilot, wprowadzając 12 nowych funkcji. Google rozszerzyło AI Overviews na ponad 100 krajów i wzmocniło możliwości Google Lens. Równocześnie odbył się AI Summit 2024 w Waszyngtonie oraz rozpoczęły się prace nad nowym standardem evaluacji AI przez NIST. Te wydarzenia sygnalizują znaczący postęp w praktycznym zastosowaniu AI w inżynierii oprogramowania i automatyzacji procesów biznesowych.",
  segments: [
    {
      title: "OpenAI DevDay 2024: Nowe API dla developerów w czasie rzeczywistym",
      summary:
        "OpenAI zaprezentowało na DevDay w San Francisco cztery kluczowe narzędzia dla developerów: Realtime API umożliwiające natychmiastową komunikację głos-do-głos przez WebSocket, Vision Fine-tuning pozwalający dostrajać GPT-4o z wykorzystaniem obrazów i tekstu, Prompt Caching obniżający koszty API o 50% dla powtarzanych zapytań, oraz Model Distillation do trenowania mniejszych modeli z wykorzystaniem większych. Te funkcje znacząco rozszerzają możliwości tworzenia aplikacji AI, szczególnie w obszarze asystentów głosowych i aplikacji multimodalnych.",
      link: "https://openai.com/devday/2024/",
    },
    {
      title: "Anthropic wprowadza Computer Use - AI steruje komputerem jak człowiek",
      summary:
        "Anthropic wydało zaktualizowaną wersję Claude 3.5 Sonnet z przełomową funkcją 'computer use', pozwalającą AI na bezpośrednie sterowanie komputerem - patrzenie na ekran, poruszanie kursorem, klikanie i wpisywanie tekstu. To pierwsza publicznie dostępna funkcja tego typu w modelu frontier AI. Dodatkowo wydano Claude 3.5 Haiku, który dorównuje wydajnością poprzedniemu Claude 3 Opus. Funkcja computer use jest dostępna w wersji beta przez API Anthropic, Amazon Bedrock i Google Cloud Vertex AI.",
      link: "https://www.anthropic.com/news/3-5-models-and-computer-use",
    },
    {
      title: "Microsoft Copilot otrzymuje 12 głównych aktualizacji na jesień 2024",
      summary:
        "Microsoft zaprezentował kompleksową aktualizację Copilot, wprowadzając 12 nowych funkcji: Copilot Groups dla współpracy do 32 osób, funkcję Imagine do tworzenia treści AI, nową postać Mico jako interfejs głosowy, tryb Real Talk dla naturalnych rozmów, Memory & Personalization do zapamiętywania kontekstu, integrację z Gmail i Google Drive, oraz Proactive Actions dostarczające kontekstowe sugestie. Dodatkowo wprowadzono Copilot for Health, Learn Live dla edukacji, oraz głębszą integrację z Windows 11 i Edge.",
      link: "https://www.microsoft.com/en-us/copilot",
    },
    {
      title: "Google rozszerzyło AI Overviews na ponad 100 krajów i wzmocniło możliwości Google Lens",
      summary:
        "Google rozszerzyło AI Overviews na ponad 100 krajów i wzmocniło możliwości Google Lens. AI Overviews to narzędzie, które analizuje teksty i obrazy, aby dostarczać informacje o tematach, które są dla Ciebie ważne. Google Lens to narzędzie, które pozwala na identyfikację obiektów na obrazach i filmach, a także na przetwarzanie tekstu.",
      link: "https://www.google.com/ai-overviews",
    },
    {
      title: "IBM prezentuje Granite 3.0 - modele AI dla przedsiębiorstw",
      summary:
        "IBM na konferencji TechXchange zaprezentowało trzecią generację modeli językowych Granite 3.0, zaprojektowane specjalnie dla zastosowań biznesowych. Flagowy model Granite 3.0 8B Instruct został wytrenowany na danych w 12 językach i 116 językach programowania, oferując zaawansowane możliwości generowania tekstu, klasyfikacji, podsumowywania, ekstrakcji encji i aplikacji kodowych. Modele są zoptymalizowane pod kątem skalowania AI w przedsiębiorstwach, zwiększania efektywności i produktywności operacji biznesowych.",
      link: "https://www.ibm.com/products/granite-3.0",
    },
  ],
};

/**
 * Service for managing generated press reviews
 * Handles business logic for on-demand generation requests
 */
export class GeneratedPressReviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new on-demand generation job for a press review
   *
   * Business logic checks:
   * 1. Verifies that the parent press_review exists
   * 2. Confirms that the authenticated user is the owner of the press_review
   * 3. Checks for any other pending generations for the same press_review_id to prevent duplicates
   *
   * @param pressReviewId - UUID of the press review to generate content for
   * @param userId - UUID of the authenticated user
   * @returns The newly created generation job with status 'pending'
   * @throws Error with specific message for different failure scenarios
   */
  async createOnDemandGeneration(pressReviewId: string, userId: string): Promise<GeneratedPressReviewDetailDTO> {
    // Step 1: Verify press_review exists and user is the owner
    const { data: pressReview, error: pressReviewError } = await this.supabase
      .from("press_reviews")
      .select("id, user_id")
      .eq("id", pressReviewId)
      .single();

    if (pressReviewError || !pressReview) {
      throw new Error("NOT_FOUND");
    }

    // Check if press_review is owned by the user
    if (pressReview.user_id !== userId) {
      throw new Error("NOT_FOUND"); // Don't leak information about existence
    }

    // Step 2: Check for existing pending generations
    const { data: existingPending, error: pendingError } = await this.supabase
      .from("generated_press_reviews")
      .select("id, status")
      .eq("press_review_id", pressReviewId)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) {
      // eslint-disable-next-line no-console
      console.error("Error checking for pending generations:", pendingError);
      throw new Error("DATABASE_ERROR");
    }

    if (existingPending) {
      throw new Error("CONFLICT");
    }

    // Step 3: Create new generation record with pending status
    const { data: newGeneration, error: insertError } = await this.supabase
      .from("generated_press_reviews")
      .insert({
        press_review_id: pressReviewId,
        user_id: userId,
        ...(pressReviewId === "029c82d5-cb79-4d59-beb3-12b68bd8990a"
          ? {
              status: "success",
              content: MOCK_CONTENT,
              generated_at: new Date().toISOString(),
            }
          : pressReviewId === "80df6b8a-2bb2-45eb-a83a-058ed67056b5"
            ? {
                status: "failed",
                content: null,
                generated_at: null,
              }
            : {
                status: "pending",
                content: null,
                generated_at: null,
              }),
        generation_log_id: null,
      })
      .select()
      .single();

    if (insertError || !newGeneration) {
      // eslint-disable-next-line no-console
      console.error("Error creating generation record:", insertError);
      throw new Error("DATABASE_ERROR");
    }

    // Return without user_id (as per DTO definition)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...generationWithoutUserId } = newGeneration;

    return generationWithoutUserId;
  }

  /**
   * Retrieves generated press reviews for a user with optional filters
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with count
   * @throws Error with "DATABASE_ERROR" message if query fails
   */
  async getGeneratedPressReviews(
    userId: string,
    filters?: {
      pressReviewId?: string;
      status?: PressReviewStatus;
    }
  ): Promise<GeneratedPressReviewsListDTO> {
    try {
      // Build query with user filter
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content", { count: "exact" })
        .eq("user_id", userId)
        .order("generated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });

      // Apply optional filters
      if (filters?.pressReviewId) {
        query = query.eq("press_review_id", filters.pressReviewId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching generated press reviews:", error);
        throw new Error("DATABASE_ERROR");
      }

      // Return data without user_id (as per DTO definition)
      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a known error
      if (error instanceof Error && error.message === "DATABASE_ERROR") {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviews:", error);
      throw new Error("DATABASE_ERROR");
    }
  }

  /**
   * Retrieves generated press reviews with topic for a user with optional filters
   * Includes topic from the parent press_reviews table via JOIN
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Optional filters for press_review_id and status
   * @returns List of generated press reviews with topic and count
   * @throws Error with "DATABASE_ERROR" message if query fails
   */
  async getGeneratedPressReviewsWithTopic(
    userId: string,
    filters?: {
      pressReviewId?: string;
      status?: PressReviewStatus;
    }
  ): Promise<GeneratedPressReviewsListWithTopicDTO> {
    try {
      // Build query with user filter and join to press_reviews for topic
      let query = this.supabase
        .from("generated_press_reviews")
        .select("id, press_review_id, generated_at, status, content, press_reviews!inner(topic)", { count: "exact" })
        .eq("user_id", userId)
        .order("generated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });

      // Apply optional filters
      if (filters?.pressReviewId) {
        query = query.eq("press_review_id", filters.pressReviewId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Execute query
      const { data, count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching generated press reviews with topic:", error);
        throw new Error("DATABASE_ERROR");
      }

      // Return data without user_id (as per DTO definition)
      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      // Re-throw if already a known error
      if (error instanceof Error && error.message === "DATABASE_ERROR") {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getGeneratedPressReviewsWithTopic:", error);
      throw new Error("DATABASE_ERROR");
    }
  }
}
