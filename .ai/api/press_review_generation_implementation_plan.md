### **Final Implementation Plan: Agent-Based Press Review Generation**

This plan outlines the definitive steps to implement an asynchronous, agent-based workflow for generating press reviews, incorporating the Vercel AI SDK, OpenAI, and Exa for a robust and modern architecture.

---

#### **Phase 1: Database Schema and Project Setup**

**1.1. Update Database Schema for Agent Workflow**

- **Action**: Create a new SQL migration to enhance `generated_press_reviews` with detailed status tracking and `generation_logs` for storing process artifacts.
- **File to Create**: `supabase/migrations/YYYYMMDDHHMMSS_refactor_generation_status.sql`
- **Instructions**:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_refactor_generation_status.sql

-- Step 1: Create a new ENUM type for the detailed generation statuses.
CREATE TYPE generation_status AS ENUM (
    'pending',
    'generating_queries',
    'researching_sources',
    'synthesizing_content',
    'success',
    'failed'
);

-- Step 2: Alter the 'generated_press_reviews' table to use the new ENUM for its status column.
-- This command will replace the existing status column's type.
ALTER TABLE public.generated_press_reviews
ALTER COLUMN status TYPE generation_status USING status::text::generation_status;

-- Step 3: Add new JSONB columns to 'generation_logs' to store the artifacts of the generation process.
ALTER TABLE public.generation_logs
ADD COLUMN generated_queries jsonb,
ADD COLUMN research_results jsonb;
```

**1.2. Set Up Supabase Edge Functions Structure**

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

- **Action**: Modify the service to create both a `generated_press_reviews` record and its associated `generation_logs` entry.
- **File to Modify**: `src/lib/services/generatedPressReviewService.ts`
- **Instructions**:
  - Refactor the `createOnDemandGeneration` method to create a record in `generated_press_reviews` with a status of `'pending'` and a corresponding entry in `generation_logs`.
  - The method must return the newly created `generated_press_reviews` object.

**2.2. Update `POST /api/generated_press_reviews` Endpoint**

- **Action**: Modify the API endpoint to be a non-blocking trigger for the new asynchronous workflow.
- **File to Modify**: `src/pages/api/generated_press_reviews.ts`
- **Instructions**:
  1.  Call the updated `createOnDemandGeneration` service method.
  2.  Asynchronously invoke the `generate-queries` Edge Function without `await`ing the response.
  3.  Pass `{ generated_press_review_id: newReview.id }` in the function body.
  4.  If the invocation call itself fails, update the status of the `generated_press_reviews` record to `'failed'`.
  5.  Return a `202 Accepted` HTTP status code with the new review object.

---

#### **Phase 3: Implement Core Logic in Edge Functions with Vercel AI SDK and Exa**

**Shared Setup for Phase 3:**

- **Dependencies**: Ensure `import_map.json` in each function includes `@ai-sdk/openai`, `ai`, `zod`, and `exa-js`.
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
      - Provide the Zod schema to the `schema` property.
      - The prompt should instruct the model to act as a research assistant and generate 3-5 diverse search queries for the given topic.
  5.  Save the `queries` array from the validated `object` property of the result to the `generated_queries` column in `generation_logs`.
  6.  Invoke the `execute-research` function.
  7.  On failure, update the review's status to `'failed'`.

**3.2. `execute-research` Function (The Research Agent)**

- **File**: `supabase/functions/execute-research/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'researching_sources'`.
  3.  Fetch the `generated_queries` array from `generation_logs`.
  4.  **Define the Exa Search Tool**:
      - Use the `tool` utility from the Vercel AI SDK to define `exaSearchTool`.
      - Set the `inputSchema` to `z.object({ query: z.string() })`.
      - The `execute` function will call `await exa.searchAndContents(query, { numResults: 3, text: true })` and return a formatted string of the results.
  5.  **Execute Research in Parallel**:
      - Map over the `generated_queries` and create a promise for each that calls `generateText`.
      - Pass the query as the prompt and provide `exaSearchTool` in the `tools` option.
      - Use `Promise.allSettled` to run all research tasks concurrently.
  6.  Collect successful results (summaries generated by the model from the tool's output) and save them to the `research_results` column in `generation_logs`.
  7.  Invoke the `synthesize-content` function.
  8.  If all research tasks fail, update the review's status to `'failed'`.

**3.3. `synthesize-content` Function (The Synthesis Agent)**

- **File**: `supabase/functions/synthesize-content/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'synthesizing_content'`.
  3.  Fetch and concatenate the `research_results` from `generation_logs` into a single context string.
  4.  Use the `generateText` function with a powerful model like `openai('gpt-4-turbo')`.
  5.  Construct a detailed prompt instructing the model to act as a professional journalist, synthesizing the provided research context into a well-structured press review.
  6.  Save the resulting text to the `content` column of the `generated_press_reviews` table.
  7.  Update the final status of the review to `'success'`.
  8.  If synthesis fails, update the review's status to `'failed'`.
