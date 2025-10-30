### **Final Implementation Plan: Agent-Based Press Review Generation**

This plan outlines the definitive steps to implement an asynchronous, agent-based workflow for generating press reviews, incorporating the Vercel AI SDK, OpenAI, and Exa for a robust and modern architecture.

---

#### **Phase 1: Database Schema and Project Setup**

**1.1. Update Database Schema for Agent Workflow**

- **Action**: Create a new SQL migration to refactor the `generated_press_reviews` table. This change removes the separate `generation_logs` table and consolidates all generation artifacts and status tracking into `generated_press_reviews`.
- **File to Create**: `supabase/migrations/YYYYMMDDHHMMSS_refactor_generation_process.sql`
- **Instructions**:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_refactor_generation_process.sql

-- Step 1: Create a new ENUM type for the detailed generation statuses.
CREATE TYPE generation_status AS ENUM (
    'pending',
    'generating_queries',
    'researching_sources',
    'synthesizing_content',
    'success',
    'failed'
);

-- Step 2: Alter the 'generated_press_reviews' table to use the new ENUM and add new columns.
-- This command will replace the existing status column's type.
ALTER TABLE public.generated_press_reviews
ALTER COLUMN status TYPE generation_status USING status::text::generation_status;

-- Step 3: Add new JSONB columns to store artifacts and an error column.
ALTER TABLE public.generated_press_reviews
ADD COLUMN generated_queries jsonb,
ADD COLUMN research_results jsonb,
ADD COLUMN analysis jsonb,
ADD COLUMN error text,
DROP COLUMN generation_log_id;

-- Step 4: Drop the now-redundant generation_logs table.
DROP TABLE public.generation_logs;

```

**1.2. Update Type Definitions**

- **Action**: After applying the migration, regenerate the Supabase type definitions and update the application's shared types.
- **File to Modify**: `src/types.ts` and `src/db/database.types.ts`
- **Instructions**:
  - Run the Supabase CLI command to update `database.types.ts`: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/database.types.ts`
  - Review `src/types.ts` and update any DTOs or ViewModels that were dependent on the old schema, ensuring they align with the new `generated_press_reviews` structure.

**1.3. Set Up Supabase Edge Functions Structure**

- **Action**: Create the necessary directory structure and placeholder files for the new Edge Functions and their shared modules.
- **Files to Create**:
  - `supabase/functions/generate-queries/index.ts`
  - `supabase/functions/execute-research/index.ts`
  - `supabase/functions/synthesize-content/index.ts`
  - `supabase/functions/_shared/ai-clients.ts` (For initializing AI clients)
  - `supabase/functions/_shared/supabase-client.ts`
  - `supabase/functions/_shared/types.ts`

---

#### **Phase 2: Refactor API Endpoint and Service Logic**

**2.1. Update `GeneratedPressReviewService`**

- **Action**: Modify the service to create a `generated_press_reviews` record with a pending status.
- **File to Modify**: `src/lib/services/generatedPressReviewService.ts`
- **Instructions**:
  - Refactor the `createOnDemandGeneration` method to create a single record in `generated_press_reviews` with a status of `'pending'`.
  - The method must return the newly created `generated_press_reviews` object.

**2.2. Update `POST /api/generated_press_reviews` Endpoint**

- **Action**: Modify the API endpoint to be a non-blocking trigger for the new asynchronous workflow.
- **File to Modify**: `src/pages/api/generated_press_reviews.ts`
- **Instructions**:
  1.  Call the updated `createOnDemandGeneration` service method.
  2.  Asynchronously invoke the `generate-queries` Edge Function without `await`ing the response.
  3.  Pass `{ generated_press_review_id: newReview.id }` in the function body.
  4.  If the invocation call itself fails, update the `generated_press_reviews` record's status to `'failed'` and store the error message in the `error` column.
  5.  Return a `202 Accepted` HTTP status code with the new review object.

---

#### **Phase 3: Implement Core Logic in Edge Functions with Vercel AI SDK and Exa**

**Shared Setup for Phase 3:**

- **Environment Variables**: Set `OPENAI_API_KEY` and `EXA_API_KEY` in Supabase project secrets.
- **Shared Clients**: Create `supabase/functions/_shared/ai-clients.ts` to initialize and export reusable clients for OpenAI and Exa, accessing environment variables with `Deno.env.get()`.

**3.1. `generate-queries` Function**

- **File**: `supabase/functions/generate-queries/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'generating_queries'`.
  3.  Fetch the press review `topic` from the database.
  4.  **Use `generateObject` for structured output**:
      - Define a Zod schema for the desired output: `z.object({ queries: z.array(z.string()) })`.
      - Call the `generateObject` function from the Vercel AI SDK with a model like `openai('gpt-4o-mini')`.
      - The prompt should instruct the model to act as a research assistant. It must first create a concept map for the given topic to identify key themes and entities, and then generate 3-5 diverse search queries based on that map.
  5.  Save the `queries` array to the `generated_queries` column in the `generated_press_reviews` table.
  6.  Invoke the `execute-research` function.
  7.  On failure, update the review's status to `'failed'` and save the error.

**3.2. `execute-research` Function (The Research Agent)**

- **File**: `supabase/functions/execute-research/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'researching_sources'`.
  3.  Fetch the press review to get both the `generated_queries` and the cron `schedule`.
  4.  Calculate the `startPublishedDate` based on the cron schedule (e.g., 1 day ago for daily, 7 days for weekly).
  5.  **Define Tools**:
      - **`exaSearchTool`**: Uses the `tool` utility. Its `execute` function will call `await exa.searchAndContents(query, { ..., startPublishedDate: calculatedDate })`.
      - **`sourceEvaluatorTool`**: A new tool that takes both the article content and its source link as input. First, it checks if the source is present in the list of already processed sources or in a list of irrelevant sources; if it is, the tool skips further evaluation. If not, it uses `generateObject` with a prompt to assess the objectivity and credibility of the article, evaluating whether the source should be classified as relevant or irrelevant. Based on this classification, the source is added to either the relevant or irrelevant sources list for tracking.
  6.  **Execute Research Sequentially**:
      - Initialize an empty array for `researchResults` and a `Set` for `irrelevant`.
      - Use a `for...of` loop to iterate through the `generated_queries`.
      - In each iteration:
        a. Call `exaSearchTool` to get a list of candidate articles for the current query.
        b. For each candidate article, call the `sourceEvaluatorTool` to classify it as relevant or irrelevant.
        c. After the articles has been classified, the relevant articles should be processed: key facts and opinions should be extracted.

        The prompt for this step should instruct the model to only extract information and not summarize. Most importantly conduct the whole process.

      - Add the validated and processed results to `researchResults` and the source URLs to `irrelevant`.

  7.  Save the completed `researchResults` array to the `research_results` column.
  8.  Invoke the `synthesize-content` function.
  9.  On failure, update the review's status to `'failed'` and save the error.

**3.3. `synthesize-content` Function (The Synthesis Agent)**

- **File**: `supabase/functions/synthesize-content/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'synthesizing_content'`.
  3.  Fetch the `research_results` from `generated_press_reviews`.
  4.  **Use `generateObject` for structured output**:
      - Define a Zod schema for the final output: `z.object({ pressReviewContent: z.any(), processAnalysis: z.any() })`.
      - Use a powerful model like `openai('gpt-4-turbo')`.
      - Construct a detailed prompt instructing the model to act as a professional journalist. It must synthesize the provided facts and opinions into a compact, well-structured press review, including references to the sources. It should also generate a separate analysis of the source quality and key themes discovered.
  5.  Save the `pressReviewContent` to the `content` column of the `generated_press_reviews` table.
  6.  Save the `processAnalysis` to the `analysis` column.
  7.  Update the final status of the review to `'success'`.
  8.  On failure, update the review's status to `'failed'` and save the error.
