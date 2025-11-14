# Comprehensive Test Plan for Press Review AI

## 1. Test Strategy Overview

The test strategy for this project will adopt a multi-layered approach, focusing on ensuring the reliability, security, and functionality of the application from individual components to end-to-end user flows. Given the architecture (Astro for server-side rendering, React for dynamic UI, and Supabase for the backend), the strategy will combine static analysis, unit, integration, and end-to-end testing.

The primary goal is to validate the core business logic within the service layer, secure the API endpoints, ensure the UI components are bug-free, and verify that the critical user flows work as expected. Special attention will be given to the asynchronous press review generation process, as it is a complex and critical feature.

## 2. Technology Stack Considerations

- **Astro & React:** Testing will need to cover both static Astro pages and interactive React components (Astro Islands). We'll use tools that can handle this hybrid environment.
- **Supabase:** Testing will require a dedicated test environment (a separate Supabase project) to avoid polluting the development or production databases. Tests will cover database interactions, authentication, and the invocation of database triggers and edge functions.
- **TypeScript:** We will leverage TypeScript's static analysis capabilities by ensuring strict type checking is enforced throughout the codebase.
- **API Routes:** API endpoints are critical and will be tested at the integration level to ensure they handle requests, authentication, validation, and errors correctly.

## 3. Test Categories

- **Unit Tests:** Focus on individual functions and React components in isolation. For example, testing utility functions (`cronUtils.ts`) and the behavior of UI components (`LoginForm.tsx`).
- **Integration Tests:** Test the collaboration between different parts of the application. This will be the primary way to test API endpoints, service layer logic, and database interactions.
- **End-to-End (E2E) Tests:** Simulate real user scenarios in a browser. These tests will cover critical user flows from start to finish, such as user registration, creating a press review, and viewing generated content.
- **Database Tests:** Specific tests for database functions and triggers. For instance, testing the trigger that limits users to 5 press reviews.

## 4. Priority Levels

- **High:** Core functionality without which the application is unusable. This includes user authentication, press review CRUD, and the generation pipeline.
- **Medium:** Important features that are not critical for the main workflow, or edge cases in critical features.
- **Low:** UI/UX details, non-critical error states, or administrative features.

## 5. Specific Test Areas

### Authentication & Authorization

- **What:** User registration, login, logout, password management, and route protection.
- **Why:** Critical for application security and user management.
- **Approach:**
  - **Integration Tests** for API endpoints (`/api/auth/*`).
  - **E2E Tests** for user flows (registration, login, accessing protected pages).
- **Priority:** High

### Press Review Management (CRUD)

- **What:** Creating, updating, deleting, and listing press reviews.
- **Why:** Core functionality of the application.
- **Approach:**
  - **Integration Tests** for the `PressReviewService` and the `/api/press_reviews` endpoints. Test business logic like topic uniqueness and the 5-review limit.
  - **E2E Tests** for the dashboard UI where users manage their press reviews.
- **Priority:** High

### Press Review Generation

- **What:** Triggering and monitoring the press review generation process.
- **Why:** The main value proposition of the application. It's a complex, asynchronous flow involving database triggers and edge functions.
- **Approach:**
  - **Integration Tests** for the `GeneratedPressReviewService`.
  - **Integration Tests** for the database trigger (`call_generate_queries_edge_function`) to ensure it fires correctly. This might require a mock Supabase Edge Function endpoint.
  - **E2E Tests** to simulate a user triggering a generation and seeing the status update on the frontend.
- **Priority:** High

### Middleware

- **What:** Request handling, authentication checks, and redirects.
- **Why:** Central to application security and routing logic.
- **Approach:**
  - **Integration Tests** that simulate requests to different routes (public, protected, disabled) and assert the correct redirects or responses.
- **Priority:** High

### Frontend Components

- **What:** React components for forms, lists, and dialogs.
- **Why:** To ensure a smooth and bug-free user experience.
- **Approach:**
  - **Unit Tests** for individual components to test their logic and rendering based on props.
  - **E2E Tests** to check the integration of these components within pages.
- **Priority:** Medium

### Database Logic

- **What:** SQL triggers and functions in `supabase/migrations`.
- **Why:** These contain critical business logic that isn't visible at the application layer.
- **Approach:**
  - **Database Tests** using a tool like `pgTAP` or by writing test scripts that interact directly with the test database to verify the behavior of triggers (e.g., try to add a 6th press review and assert that it fails).
- **Priority:** High

## 6. Test Environment Requirements

- A separate, dedicated Supabase project for running automated tests.
- Environment variables for the test database (`SUPABASE_URL`, `SUPABASE_KEY`) configured in the CI/CD environment.
- A mechanism to seed the test database with predictable data before test runs.
- A mock server to simulate the Supabase Edge Functions for testing the `pg_net` trigger without invoking the actual function.

## 7. Recommended Tools and Frameworks

Since no testing frameworks are currently in the project, here is a recommended setup:

- **Test Runner & Assertion Library:** **Vitest**. It's fast, compatible with Vite (which Astro uses), and has a Jest-compatible API.
- **E2E Testing:** **Playwright**. It's modern, reliable, and has great features for testing web applications. It can handle the Astro/React hybrid rendering.
- **React Component Testing:** **React Testing Library** (with Vitest). For unit-testing React components.
- **Mocking:** **`msw` (Mock Service Worker)** for mocking API requests in tests, especially for mocking Supabase and external services.
