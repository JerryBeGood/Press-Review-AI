# REST API Plan

## 1. Resources

- **Press Reviews**: Represents the configuration for a recurring press review.
  - Corresponds to the `press_reviews` table.
- **Generated Press Reviews**: Represents a single, generated instance of a press review.
  - Corresponds to the `generated_press_reviews` table.
- **Generation Logs**: Represents the detailed logs for a generated press review.
  - Corresponds to the `generation_logs` table.

## 2. Endpoints

All endpoints are prefixed with `/api`.

### 2.1 Press Reviews

#### **`GET /press-reviews`**

- **Description**: Retrieves all of the authenticated user's press reviews. Since each user can have at most 5 press reviews, pagination and sorting are not necessary.
- **Response: `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "topic": "string",
        "schedule": "string (cron format)",
        "created_at": "timestamptz",
        "updated_at": "timestamptz"
      }
    ],
    "count": "integer"
  }
  ```
- **Error Response: `401 Unauthorized`**: If the user is not authenticated.

---

#### **`POST /press-reviews`**

- **Description**: Creates a new press review for the authenticated user.
- **Request Body**:
  ```json
  {
    "topic": "string",
    "schedule": "string (cron format)"
  }
  ```
- **Response: `201 Created`**:
  ```json
  {
    "id": "uuid",
    "topic": "string",
    "schedule": "string (cron format)",
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input (e.g., bad cron format, missing fields).
  - `401 Unauthorized`: User not authenticated.
  - `403 Forbidden`: User has reached the limit of 5 active press reviews.
  - `409 Conflict`: User already has scheduled press review with duplicate title

---

#### **`GET /press-reviews/{id}`**

- **Description**: Retrieves a single press review by its ID.
- **Response: `200 OK`**:
  ```json
  {
    "id": "uuid",
    "topic": "string",
    "schedule": "string (cron format)",
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User not authenticated.
  - `404 Not Found`: Press review not found or user does not have access.

---

#### **`PATCH /press-reviews/{id}`**

- **Description**: Updates an existing press review.
- **Request Body**:
  ```json
  {
    "topic": "string (optional)",
    "schedule": "string (cron format, optional)"
  }
  ```
- **Response: `200 OK`**:
  ```json
  {
    "id": "uuid",
    "topic": "string",
    "schedule": "string (cron format)",
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input.
  - `401 Unauthorized`: User not authenticated.
  - `404 Not Found`: Press review not found or user does not have access.

---

#### **`DELETE /press-reviews/{id}`**

- **Description**: Deletes a press review.
- **Response: `204 No Content`**
- **Error Responses**:
  - `401 Unauthorized`: User not authenticated.
  - `404 Not Found`: Press review not found or user does not have access.

---

#### **`POST /press-reviews/validate-topic`**

- **Description**: Validates a press review topic using the AI agent.
- **Request Body**:
  ```json
  {
    "topic": "string"
  }
  ```
- **Response: `200 OK`**:
  ```json
  {
    "is_valid": "boolean",
    "suggestions": ["string", "string"]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Topic is missing or empty.
  - `401 Unauthorized`: User not authenticated.
  - `503 Service Unavailable`: AI service is down or not responding.

### 2.2 Generated Press Reviews

#### **`GET /generated-press-reviews`**

- **Description**: Retrieves a list of generated press reviews for the authenticated user. Can be filtered by the parent `press_review_id`.
- **Query Parameters**:
  - `press_review_id` (uuid, optional): Filter by parent press review.
  - `status` (string, optional): Filter by status (`pending`, `success`, `failed`).
- **Response: `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "press_review_id": "uuid",
        "generated_at": "timestamptz",
        "status": "string",
        "content": "jsonb"
      }
    ],
    "count": "integer"
  }
  ```
- **Error Response: `401 Unauthorized`**.

#### **`POST /generated-press-reviews`**

- **Description**: Triggers on-demand generation of a press review instance for the authenticated user. Returns immediately with the newly created generation job, which will transition from `pending` to `success` or `failed` asynchronously.
- **Request Body**:
  ```json
  {
    "press_review_id": "uuid"
  }
  ```
- **Response: `202 Accepted`**:
  ```json
  {
    "id": "uuid",
    "press_review_id": "uuid",
    "generated_at": "timestamptz (null until completed)",
    "status": "string (initially 'pending')",
    "content": "null",
    "generation_log_id": "null"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `press_review_id` missing or user not owner.
  - `401 Unauthorized`: User not authenticated.
  - `404 Not Found`: Parent press review not found or inactive.
  - `409 Conflict`: Another generation for this press review is already in progress.

---

#### **`GET /generated-press-reviews/{id}`**

- **Description**: Retrieves a single generated press review by its ID.
- **Response: `200 OK`**:
  ```json
  {
    "id": "uuid",
    "press_review_id": "uuid",
    "generated_at": "timestamptz",
    "status": "string",
    "content": "jsonb",
    "generation_log_id": "uuid"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`.
  - `404 Not Found`.

### 2.4 Generation Logs

#### **`GET /generation-logs/{id}`**

- **Description**: Retrieves the generation log for a specific generated press review. The ID corresponds to the `generation_logs` table ID.
- **Response: `200 OK`**:
  ```json
  {
    "id": "uuid",
    "generated_press_review_id": "uuid",
    "log_data": "jsonb",
    "created_at": "timestamptz"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`.
  - `404 Not Found`.

## 3. Authentication and Authorization

- **Mechanism**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth.
- **Implementation**:
  1. The client is responsible for user registration and login via the Supabase client SDK, which handles token acquisition and refresh.
  2. Every request to a protected API endpoint must include an `Authorization` header with the value `Bearer <SUPABASE_JWT>`.
  3. The Astro backend will use a middleware or a helper function to verify the JWT on incoming requests using the Supabase Admin SDK.
  4. Authorization is enforced at the database level using PostgreSQL Row-Level Security (RLS) policies, as defined in the database plan. The policies ensure that users can only access or modify their own data (`user_id = auth.uid()`).

## 4. Validation and Business Logic

### 4.1 Validation

- All API endpoints will validate incoming data against the `NOT NULL` and data type constraints defined in the database schema before executing a query.
- **`POST /press-reviews`**:
  - `topic`: Must be a non-empty string.
  - `schedule`: Must be a valid CRON expression.

### 4.2 Business Logic

- **AI Topic Validation**: A dedicated endpoint, `POST /press-reviews/validate-topic`, is provided to decouple the AI validation logic from the resource creation logic. This allows the frontend to provide real-time feedback to the user as required by the PRD.
