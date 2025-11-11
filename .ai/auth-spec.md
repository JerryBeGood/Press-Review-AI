# Authentication Module - Technical Specification

## 1. Overview

This document outlines the architecture for the user authentication module for the Press Review AI application. The implementation will leverage Supabase Auth integrated with an Astro and React frontend, based on the requirements specified in `prd.md` (PRSR-001, PRSR-002, PRSR-003, PRSR-004) and the existing technology stack.

## 2. User Interface Architecture

The UI will be composed of Astro pages for routing and structure, and React components for interactive elements like forms. We will use Shadcn/ui for pre-built components.

### 2.1. Layouts

- **`src/layouts/layout.astro`**: The main layout for all pages. It will be updated to include a header that conditionally renders either a "Login" button for unauthenticated users or a `UserNav` component for authenticated users. It will receive the user session status from page props.
- **`src/layouts/AuthLayout.astro` (New)**: A simple layout for authentication-related pages (`/login`, `/register`, etc.). It will feature a centered container for the auth forms without the main site navigation.
- **`src/layouts/DashboardLayout.astro`**: The existing layout for authenticated users. It will be protected and will assume a valid user session is present.

### 2.2. Pages (Astro)

All pages will be server-rendered to handle redirects and session checks. This will be configured by setting `export const prerender = false;` on each page or by setting `output: 'server'` in the config.

- **`src/pages/index.astro` (Updated)**: This will become the root landing page. It will perform a server-side check for a user session. If a session exists, it will redirect to `/dashboard`. Otherwise, it will redirect to `/login`.
- **`src/pages/login.astro` (New)**:
  - Renders the `LoginForm` component.
  - Uses `AuthLayout`.
  - If a user with a valid session tries to access it, they will be redirected to `/dashboard`.
- **`src/pages/register.astro` (New)**:
  - Renders the `RegisterForm` component.
  - Uses `AuthLayout`.
  - Redirects authenticated users to `/dashboard`.
- **`src/pages/forgot-password.astro` (New)**:
  - Renders the `ForgotPasswordForm` component.
  - Uses `AuthLayout`.
- **`src/pages/reset-password.astro` (New)**:
  - Renders the `ResetPasswordForm` component.
  - Uses `AuthLayout`.
  - This page will contain client-side logic to handle the password reset token from the URL.
- **`src/pages/auth/callback.ts` (New API Route)**:
  - This endpoint handles callbacks from Supabase for asynchronous authentication flows (e.g., email verification). When the user clicks the verification link, Supabase verifies the token and redirects the user back to a pre-configured URL in our application, hitting this endpoint. This handler is responsible for completing the authentication flow and managing the creation of the user session via cookies in an SSR context.
- **`src/pages/dashboard/index.astro` (Moved from `/index.astro`)**:
  - This is the main user dashboard, containing the logic from the previous `src/pages/index.astro`.
  - Access will be restricted by the middleware.
- **`src/pages/dashboard/archive.astro` (Moved from `/archive.astro`)**:
  - This page will be moved to group it with other protected dashboard pages.
  - Access will be restricted by the middleware.

### 2.3. Components (React)

These components will manage form state, client-side validation, and interaction with our API endpoints. We will use `react-hook-form` for form handling and `zod` for validation.

- **`src/components/auth/LoginForm.tsx` (New)**:
  - **Fields**: Email, Password.
  - **Actions**: Submits to `/api/auth/login`.
  - **Validation**:
    - Email: Must be a valid email format.
    - Password: Required.
  - **Error Handling**: Displays errors from the API (e.g., "Invalid credentials").
- **`src/components/auth/RegisterForm.tsx` (New)**:
  - **Fields**: Email, Password, Confirm Password.
  - **Actions**: Submits to `/api/auth/register`.
  - **Validation**:
    - Email: Must be a valid email format.
    - Password: Min. 8 characters.
    - Confirm Password: Must match Password.
  - **UI Feedback**: Upon successful submission, displays a message instructing the user to check their email for a verification link.
- **`src/components/auth/ForgotPasswordForm.tsx` (New)**:
  - **Fields**: Email.
  - **Actions**: Submits to `/api/auth/forgot-password`.
  - **UI Feedback**: On success, shows a message about the password reset email being sent.
- **`src/components/auth/ResetPasswordForm.tsx` (New)**:
  - **Fields**: New Password, Confirm New Password.
  - **Actions**: Will use the Supabase JS client on the client-side to update the password.
  - **Logic**: On component mount, it will listen for Supabase's `onAuthStateChange` event, specifically for the `PASSWORD_RECOVERY` event. When this event is triggered (after Supabase processes the token from the URL hash), the form will be enabled. On submit, it calls `supabase.auth.updateUser()` with the new password.
  - **UI Feedback**: On success, redirects to `/login` with a success message. Displays an error if the reset link is invalid or expired.
- **`src/components/auth/UserNav.tsx` (New)**:
  - Displayed in the header for authenticated users.
  - Shows user's email or avatar.
  - Contains a dropdown with links to "Settings" and a "Logout" button.
  - The "Logout" button will be a form that POSTs to `/api/auth/logout`.

### 2.4. Scenarios Handled

- **Registration**: User submits form -> API returns success -> UI shows "Check your email" message. User cannot log in.
- **Email Verification**: User clicks link in email -> Supabase verifies and redirects to `/login` -> UI shows "Account verified. You can now log in." toast/message.
- **Login**: User submits form -> API validates -> On success, API sets session cookies and redirects to `/dashboard`. On failure, API returns error -> UI displays the error message.
- **Password Reset**: User requests reset -> UI shows "Email sent" message. User clicks link -> Lands on `/reset-password` page. User sets new password -> UI shows "Password updated" and redirects to `/login`.

## 3. Backend Logic

### 3.1. API Endpoints

We will use Astro API routes for handling authentication logic. These endpoints will be server-side and interact with the Supabase Admin client.

- **`src/pages/api/auth/register.ts` (POST)**:
  - **Body**: `{ email, password }`
  - **Logic**:
    1.  Validate input using a shared Zod schema.
    2.  Call `supabase.auth.signUp()`.
    3.  The `emailRedirectTo` option will be configured to point to the login page.
  - **Response**:
    - `200 OK`: On success.
    - `400 Bad Request`: If validation fails or email is already in use.
    - `500 Internal Server Error`: For Supabase errors.
- **`src/pages/api/auth/login.ts` (POST)**:
  - **Body**: `{ email, password }`
  - **Logic**:
    1.  Validate input.
    2.  Call `supabase.auth.signInWithPassword()`.
    3.  If successful, Supabase automatically handles setting the secure, HTTP-only session cookies.
  - **Response**:
    - On success, redirects the user to `/dashboard`.
    - `400 Bad Request`: On validation failure or incorrect credentials.
- **`src/pages/api/auth/logout.ts` (POST)**:
  - **Logic**:
    1.  Call `supabase.auth.signOut()`. This clears the session cookies.
  - **Response**: Redirects to `/login`.
- **`src/pages/api/auth/forgot-password.ts` (POST)**:
  - **Body**: `{ email }`
  - **Logic**:
    1.  Validate input.
    2.  Call `supabase.auth.resetPasswordForEmail()`, specifying the URL to the `/reset-password` page.
  - **Response**: `200 OK` (even if the user doesn't exist, to prevent email enumeration).

### 3.2. Data Validation

- A new file `src/lib/schemas/auth.schemas.ts` will contain Zod schemas for all authentication forms (register, login, forgot password, reset password).
- These schemas will be used for both client-side validation in React components and server-side validation in API routes to ensure consistency and security.

### 3.3. Server-Side Rendering and Middleware

- **`astro.config.mjs`**: Will be configured with `output: 'server'` to enable server-side rendering and middleware.
- **`src/middleware/index.ts` (Updated)**:
  - The existing middleware will be updated to handle authentication checks for protected routes.
  - It will run on every request.
  - It will create a server-side Supabase client using the request cookies.
  - It will check for a valid session using `supabase.auth.getSession()`.
  - **Route Protection**:
    - If the user is trying to access a protected route (e.g., `/dashboard/*`) without a session, they will be redirected to `/login`.
    - If the user has a session and tries to access public auth pages (e.g., `/login`, `/register`), they will be redirected to `/dashboard`.
  - **Session Data**: The user's session and profile data will be stored in `context.locals` to be accessible within Astro pages and API routes.

### 3.4. Updating Existing API Endpoints (New Section)

To transition from a single-user development setup to a multi-user application, all existing API endpoints must be refactored to enforce authentication and data ownership.

- **Remove Hardcoded User ID**: The `DEFAULT_USER_ID` constant must be removed.
- **Enforce Authentication**: Endpoints must retrieve the user's session from `context.locals.user`, which is populated by the middleware. If no user is found, the endpoint must return a `401 Unauthorized` status.
- **Scope Database Queries**: All database operations (SELECT, INSERT, UPDATE, DELETE) must be scoped to the authenticated user's ID. A `where('user_id', '=', user.id)` clause must be added to every query to ensure users can only access their own data.

## 4. Authentication System (Supabase Auth)

### 4.1. Configuration

- **Supabase Client**: We will have two ways to initialize the Supabase client:
  - **Server-Side**: A helper function in `src/db/supabase.ts` will create a server-side client for use in middleware and API routes. It will be initialized with the `service_role` key for admin operations where necessary and will manage auth via cookies.
  - **Client-Side**: A singleton instance of the client-side Supabase client will be created and made available through a React context or a simple export for use in components. This client uses the `anon` key.
- **Environment Variables**: Supabase URL and keys (`ANON_KEY`, `SERVICE_ROLE_KEY`) will be stored in a `.env` file and accessed via `import.meta.env`.
- **Email Templates**: Supabase Auth email templates (confirmation, password reset) will be customized to match the application's branding.
- **Redirect URLs**: The Supabase dashboard will be configured with the application's URLs for redirects after authentication events.

### 4.2. Session Management

- Supabase's official `@supabase/ssr` library will be used for managing sessions in an Astro SSR environment. It handles storing JWTs in secure, HTTP-only cookies.
- The middleware is the central point for reading the session on the server.
- On the client, the Supabase JS library will automatically manage the session and make it available to the React components, allowing for dynamic UI updates based on auth state.

## 5. Securing the AI Agent Workflow (New Section)

The press review generation is an automated, multi-step process orchestrated by Supabase Edge Functions, initiated by a database trigger. This entire workflow must be secured to prevent unauthorized invocation.

### 5.1. Authentication Mechanism

All server-to-server invocations between Edge Functions will be authenticated using the `SUPABASE_SERVICE_ROLE_KEY`. This key will be passed as a bearer token in the `Authorization` header. Each function will be responsible for validating this token before executing its logic.

### 5.2. Database Trigger Update

The database trigger defined in `20251103001000_add_webhook_trigger_for_generated_reviews.sql` initiates the generation process. The `call_generate_queries_edge_function()` PL/pgSQL function will be updated to:

- Use the `pg_net` extension for making the HTTP request, which is the recommended and more secure approach.
- Securely access the `SUPABASE_SERVICE_ROLE_KEY` from Supabase secrets (which must be configured in the project dashboard) and add it to the `Authorization` header of the POST request to the `generate-queries` function.

### 5.3. Edge Function Protection

All Edge Functions involved in the generation pipeline (`generate-queries`, `execute-research`, `synthesize-content`) will be updated to include an authentication check:

- A new utility function, `verifyAuth`, will be created in `_shared/utils.ts`.
- This function will read the `Authorization` header from the incoming request and compare the provided token with the `SUPABASE_SERVICE_ROLE_KEY` environment variable.
- `verifyAuth` will be called at the beginning of each Edge Function. If authentication fails, the function will immediately return a `401 Unauthorized` response.

### 5.4. Secure Function-to-Function Invocation

The `invokeEdgeFunction` utility in `_shared/utils.ts`, used for chaining function calls, will be modified to:

- Automatically read the `SUPABASE_SERVICE_ROLE_KEY` from its environment.
- Add the `Authorization` header to every outgoing request it makes, ensuring that inter-function calls are also authenticated.
