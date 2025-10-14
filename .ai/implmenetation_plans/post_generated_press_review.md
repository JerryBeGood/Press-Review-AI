# API Endpoint Implementation Plan: `POST /generated-press-reviews`

## 1. Endpoint Overview

This endpoint triggers the on-demand generation of a press review for a given `press_review_id`. The process is asynchronous; the endpoint immediately returns a `202 Accepted` status with a newly created generation job object. The job's status will be `pending` and will be updated in the background upon completion or failure.

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/generated-press-reviews`
- **Request Body**:
  ```json
  {
    "press_review_id": "uuid"
  }
  ```
- **Validation**: The request body will be validated using a Zod schema to ensure `press_review_id` is a valid UUID.

## 3. Utilized Types

The implementation will require the following new and existing types in `src/types.ts`:

- **Command Model (New)**:
  ```typescript
  /** Body of POST /generated-press-reviews */
  export interface CreateGeneratedPressReviewCmd {
    press_review_id: string; // uuid
  }
  ```
- **Response DTO (Existing)**:
  ```typescript
  /** Response for POST /generated-press-reviews */
  // This existing type perfectly matches the required response shape.
  export type GeneratedPressReviewDetailDTO = Omit<Tables<"generated_press_reviews">, "user_id">;
  ```

## 4. Response Details

- **Success Response**: `202 Accepted`
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "press_review_id": "uuid",
    "generated_at": null,
    "status": "pending",
    "content": null,
    "generation_log_id": null
  }
  ```

## 5. Data Flow

1.  A `POST` request is sent to `/api/generated-press-reviews` with a valid JWT and request body.
2.  Astro middleware verifies the user's authentication.
3.  The endpoint handler at `src/pages/api/generated-press-reviews.ts` validates the request body using a Zod schema.
4.  The handler calls the `createOnDemandGeneration` method from `src/lib/services/generatedPressReviewService.ts`.
5.  The service performs the following business logic checks:
    - Verifies that the parent `press_review` exists and is active (`is_active = true`).
    - Confirms that the authenticated user is the owner of the `press_review`.
    - Checks for any other `pending` generations for the same `press_review_id` to prevent duplicates.
6.  If all checks pass, the service inserts a new record into the `generated_press_reviews` table with `status: 'pending'`.
7.  The service returns the newly created record.
8.  The endpoint handler sends a `202 Accepted` response to the client with the returned record as the body.

## 6. Security Considerations

- **Authentication**: All requests must be authenticated via JWT. This will be enforced by Astro middleware.
- **Authorization**: The service layer must perform a strict ownership check to ensure a user can only trigger generations for `press_reviews` they own. This prevents users from accessing or acting on other users' data.

## 7. Error Handling

The endpoint will return specific HTTP status codes and error messages for different failure scenarios:

- **`400 Bad Request`**: If the request body is malformed or `press_review_id` is missing/invalid.
- **`401 Unauthorized`**: If the user is not authenticated.
- **`404 Not Found`**: If the specified `press_review` does not exist, is not owned by the user, or is inactive. This consolidated error prevents leaking information about the existence of resources.
- **`409 Conflict`**: If a generation for the specified `press_review` is already in progress (`status = 'pending'`).
- **`500 Internal Server Error`**: For any unexpected server-side issues, such as a database connection failure.

## 8. Performance Considerations

- The endpoint itself is lightweight and performs only quick validation and a single database insert.
- The heavy computational work (AI content generation) is deferred to an asynchronous background process, ensuring the API remains responsive.
- The `generated_press_reviews` table should have an index on `(press_review_id, status)` to speed up the check for conflicting `pending` jobs.

## 9. Implementation Steps

1.  **Update Types**: Add the `CreateGeneratedPressReviewCmd` interface to `src/types.ts`.
2.  **Create Zod Schema**: Create a new file for API schemas and define the validation schema for the request body.
3.  **Create Service**: Create the new service file `src/lib/services/generatedPressReviewService.ts`.
4.  **Implement Service Logic**: Implement the `createOnDemandGeneration` method within the new service, including all business logic checks (ownership, status, conflicts) and the database insertion logic using the Supabase client.
5.  **Create API Endpoint**: Create the new API route file at `src/pages/api/generated-press-reviews.ts`.
6.  **Implement Endpoint Handler**: Write the `POST` handler, integrating the Zod schema for validation, calling the service method, and handling success and error responses by returning the appropriate status codes and JSON bodies.
7.  **Add Database Index**: Ensure an efficient index exists on `generated_press_reviews(press_review_id, status)` to optimize the conflict check.
