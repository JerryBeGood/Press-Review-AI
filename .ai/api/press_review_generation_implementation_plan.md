### **Implementation Plan: Agent-Based Press Review Generation**

This plan outlines the definitive steps to implement an asynchronous, agent-based workflow for generating press reviews using Supabase Edge Functions, leveraging the existing database structure as clarified.

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
-- Ensure any existing data is compatible or migrated accordingly.
ALTER TABLE public.generated_press_reviews
ALTER COLUMN status TYPE generation_status USING status::text::generation_status;

-- Step 3: Add new JSONB columns to 'generation_logs' to store the artifacts of the generation process.
ALTER TABLE public.generation_logs
ADD COLUMN generated_queries jsonb,
ADD COLUMN research_results jsonb;

-- Note: The 'status' column is intentionally NOT added to generation_logs,
-- as the primary status is now managed on the generated_press_reviews table.
```

**1.2. Set Up Supabase Edge Functions Structure**

- **Action**: Create the necessary directory structure and placeholder files for the new Edge Functions and their shared modules.
- **Files to Create**:
  - `supabase/functions/generate-queries/index.ts`
  - `supabase/functions/execute-research/index.ts`
  - `supabase/functions/synthesize-content/index.ts`
  - `supabase/functions/_shared/supabase-client.ts` (For a Deno-compatible Supabase client)
  - `supabase/functions/_shared/types.ts` (For shared type definitions between functions)

---

#### **Phase 2: Refactor API Endpoint and Service Logic**

**2.1. Update `GeneratedPressReviewService`**

- **Action**: Modify the service to create both a `generated_press_reviews` record and its associated `generation_logs` entry.
- **File to Modify**: `src/lib/services/generatedPressReviewService.ts`
- **Instructions**:
  - Refactor the `createOnDemandGeneration` method.
  - It should first create a record in `generated_press_reviews` with an initial status of `'pending'`.
  - It should then create a corresponding entry in `generation_logs`, linking it via the foreign key.
  - The method must return the newly created `generated_press_reviews` object, which includes its ID.

**2.2. Update `POST /api/generated_press_reviews` Endpoint**

- **Action**: Modify the API endpoint to be a non-blocking trigger for the new asynchronous workflow.
- **File to Modify**: `src/pages/api/generated_press_reviews.ts`
- **Instructions**:
  1.  Call the updated `createOnDemandGeneration` service method to create the initial database records.
  2.  Asynchronously invoke the `generate-queries` Edge Function. Do not `await` the response to ensure the API returns immediately.
  3.  Pass the ID of the new review in the function payload: `{ body: { generated_press_review_id: newReview.id } }`.
  4.  Implement error handling for the invocation call itself. If `supabase.functions.invoke` returns an immediate error, update the status of the `generated_press_reviews` record to `'failed'`.
  5.  Return a `202 Accepted` HTTP status code along with the newly created `generated_press_reviews` object in the response body.

---

#### **Phase 3: Implement Core Logic in Edge Functions**

**3.1. `generate-queries` Function**

- **File**: `supabase/functions/generate-queries/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id` from the invocation payload.
  2.  Update the status of the corresponding `generated_press_reviews` record to `'generating_queries'`.
  3.  Fetch the press review topic.
  4.  Generate search queries using an AI service and save them to the `generated_queries` column in the `generation_logs` table.
  5.  Invoke the `execute-research` function, passing the `generated_press_review_id`.
  6.  If any step fails, update the review's status to `'failed'` and terminate.

**3.2. `execute-research` Function**

- **File**: `supabase/functions/execute-research/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'researching_sources'`.
  3.  Fetch the generated queries from `generation_logs`.
  4.  Execute research in parallel using `Promise.allSettled`.
  5.  Save the collected research summaries to the `research_results` column in `generation_logs`.
  6.  Invoke the `synthesize-content` function.
  7.  If research fails critically, update the review's status to `'failed'`.

**3.3. `synthesize-content` Function**

- **File**: `supabase/functions/synthesize-content/index.ts`
- **Logic**:
  1.  Receive `generated_press_review_id`.
  2.  Update the review's status to `'synthesizing_content'`.
  3.  Fetch the research results from `generation_logs`.
  4.  Synthesize the final press review content using an AI service.
  5.  Save the final content to the `content` column of the `generated_press_reviews` table.
  6.  Update the final status of the review to `'success'`.
  7.  If synthesis fails, update the review's status to `'failed'`.

---

#### **Phase 4: Testing Strategy**

- **Unit Tests**: Create tests for each Edge Function's core logic, mocking Supabase and AI client interactions.
- **Integration Test**: Develop a script (`scripts/test-generation-workflow.ts`) that:
  1.  Calls the `POST /api/generated_press_reviews` endpoint to start a job.
  2.  Polls the database to observe the `status` on the `generated_press_reviews` table as it progresses through the states.
  3.  Asserts the final status is `'success'` and that content has been generated.
