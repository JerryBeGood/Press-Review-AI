# UI Architecture for Press Review AI

## 1. Overview of the UI Structure

The user interface (UI) architecture for the Press Review AI application is based on the Astro framework, with dynamic and interactive components (‘islands’) built in React. The central navigation point is the sidebar, which provides access to key application views. Server state management is handled by the TanStack Query library, which ensures efficient data retrieval, caching, and synchronisation from the API. Forms are handled by React Hook Form with Zod schema validation. The interface is built with ready-made Shadcn/ui components, ensuring visual consistency and high accessibility. The architecture is designed with desktops in mind and focuses on providing a smooth, responsive user experience by clearly communicating the application's state.

## 2. List of views

### View: Authentication (Auth)

- **Path:** `/auth`
- **Main purpose:** To allow new users to register and existing users to log in to the application. This view is not available to logged-in users.
- **Key information to display:** Login and registration form.
- **Key components:**
  - `AuthForm`: Container component with tabs (`Tabs`) for switching between login and registration.
  - `LoginForm`: Form with fields for email and password.
  - `RegisterForm`: Form with fields for email and password.
- **UX, accessibility, and security considerations:**
  - **UX:** Clear error messages for validation and incorrect login details. The submit button is disabled during the operation.
  - **Accessibility:** Correct form labels and focus management.
- **Security:** Use of a `password` field. Routes are protected by Astro middleware, which redirects unlogged-in users to `/auth`.

### View: Dashboard

- **Path:** `/`
- **Main purpose:** Display and manage the list of scheduled press releases. This is the main screen of the application after logging in.
- **Key information to display:** List of scheduled press reviews with their topic and schedule. Empty state with a call to action (CTA) for new users.
- **Key components:**
  - `PressReviewList`: Displays a list of scheduled press reviews.
  - `PressReviewListItem`: Represents a single press review with action buttons (`Edit`, `Delete`, `Generate now`).
  - `PressReviewFormDialog`: Modal window (`Dialog`) with a form for creating and editing press reviews.
  - `AlertDialog`: Confirmation of press review deletion.
- **UX, accessibility, and security considerations:**
  - **UX:** Use of interface skeletons (`Skeleton`) when loading data. Optimistic updates on deletion for a smoother experience.
  - **Accessibility:** `aria-label` labels for icon buttons.
  - **Security:** Access to the view and all operations require authentication.

### View: Archive

- **Path:** `/archive`
- **Main purpose:** Browsing the history of all generated press releases.
- **Key information to display:** Chronological list of generated press releases with date, topic, and status (`pending`, `successful`, `failed`).
- **Key components:**
  - `GeneratedPressReviewList`: Displays a list of generated press releases.
  - `GeneratedPressReviewListItem`: Represents a single entry in the archive.
  - `Badge`: Component for visual representation of generation status.
  - `GeneratedPressReviewContentDialog`: Modal window (`Dialog`) displaying the full content of the generated press release.
- **UX, accessibility and security considerations:**
  - **UX:** Automatic status refresh (polling) for press releases in progress. Error message and retry option for failed generations.
  - **Accessibility:** The modal window with the press release content blocks focus within itself.
  - **Security:** Access to the view requires authentication.

### View: Settings

- **Path:** `/settings`
- **Main purpose:** User account management, including changing your password, email address, and deleting your account.
- **Key information to display:** Forms for changing authentication data and a separate ‘danger zone’.
- **Key components:**
  - `ChangePasswordForm`: Form for changing your password.
  - `ChangeEmailForm`: Form for changing your email address.
  - `DeleteAccountSection`: Section with a button to delete your account.
  - `AlertDialog`: Confirmation of account deletion.
- **UX, accessibility and security considerations:**
  - **UX:** Clear messages (toasts) after successful data changes. Account deletion requires additional confirmation (e.g. entering a password) to avoid mistakes.
  - **Accessibility:** Correct form labels and messages.
  - **Security:** Changing your password requires entering your old password. Deleting your account is a critical operation and requires re-authentication.

## 3. User journey map

**Main flow for a new user:**

1.  **Registration:** The user is taken to the `Authentication` view (`/auth`), fills out the registration form, and receives a verification email.
2.  **Login:** After verifying the email, the user logs in and is redirected to the `Dashboard` (`/`).
3.  **Creating a press review:** On the `Dashboard`, they click the CTA, which opens the `PressReviewFormDialog`. They fill in the topic (with real-time validation) and schedule, then save. The new press review appears in the list.
4.  **On-demand generation:** The user clicks the `Generate Now` button next to the newly created press review.
5.  **Viewing in the archive:** The user navigates to the `Archive` view (`/archive`), where they see their press review with the status `pending`. The status is automatically refreshed.
6.  **Reading content:** When the status changes to `successful`, the user clicks on the item, which opens `GeneratedPressReviewContentDialog` with the full content of the press release.
7.  **Account management:** At any time, the user can go to `Settings` (`/settings`) to change their password or delete their account.

## 4. Layout and navigation structure

- **Main layout:** The application uses a fixed layout with a sidebar and a main content area.
- **Main navigation (Sidebar):**
  - Link to `Dashboard` (`/`)
  - Link to `Archive` (`/archive`)
- **User navigation:**
  - Link to `Settings` (`/settings`)
  - `Log out` button
- **Route Guarding:** All views except `/auth` are protected. Attempting to access without authentication results in redirection to the login page.

## 5. Key components

- **`Layout`:** The main component surrounding the views, containing the side navigation panel and header. Responsible for the consistent structure of the application.
- **`PressReviewFormDialog`:** Reusable modal window for creating and editing scheduled press releases. Contains form logic, real-time topic validation, and API data transfer handling.
- **`GeneratedPressReviewContentDialog`:** A modal window displaying the formatted content of the generated press review, including a summary and individual segments with links to sources.
- **`Toast`:** A component for displaying global, non-blocking notifications (e.g., about a successful operation or API error).
- **`AlertDialog`:** A modal component used to obtain user confirmation for destructive actions (e.g., deleting a press release or account).
- **`Skeleton`:** A component used as a placeholder while loading data, improving the perceived performance of the application.
