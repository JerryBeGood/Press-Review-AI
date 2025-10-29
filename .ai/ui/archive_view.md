# Implementation Plan: Archive View

## 1. Overview

The Archive View provides users with a comprehensive history of all their generated press reviews. It allows them to browse past generations, check their status, and view the full content of each successful review. The view is designed to be dynamic, automatically updating the status of pending reviews through polling.

## 2. View Routing

The Archive View will be accessible at the following application path:

- **Path:** `/archive`

This will be implemented by creating a new Astro page at `src/pages/archive.astro`.

## 3. Component Structure

The view will be composed of a main server-rendered Astro page that hydrates a client-side React component. The component hierarchy is as follows:

```
src/pages/archive.astro
└── src/layouts/Layout.astro
    ├── src/components/layout/Header.astro
    └── src/components/archive/ArchiveView.tsx (client:load)
        ├── SkeletonLoader (placeholder)
        ├── ErrorState (displays on API failure)
        ├── EmptyState (displays if no reviews exist)
        └── GeneratedPressReviewList.tsx
            └── GeneratedPressReviewListItem.tsx[]
                └── Badge.tsx (Shadcn/ui)
        └── GeneratedPressReviewContentDialog.tsx (Shadcn/ui Dialog)
```

## 4. Component Details

### `Header.astro`

- **Description**: A shared navigation header for the application, providing links to the main pages like Dashboard and Archive.
- **Main Elements**: A `<header>` element containing a `<nav>` with an unordered list of navigation links (`<a>` tags).
- **Interactions**: Standard link navigation.
- **Validation**: None.
- **Types**: None.
- **Props**: None.

### `ArchiveView.tsx`

- **Description**: The primary client-side component that orchestrates the entire view. It handles data fetching logic, state management (loading, error, empty, success states), and renders the appropriate child components.
- **Main Elements**: It will conditionally render a skeleton loader, an error message, an empty state message, or the `GeneratedPressReviewList`. It also renders the `GeneratedPressReviewContentDialog`.
- **Interactions**:
  - Handles the `onRetry` action from the `ErrorState` component.
  - Manages the state for the currently selected review to be displayed in the dialog.
- **Validation**: None.
- **Types**: Uses `ArchiveViewModel[]` and a state machine for fetch status (`'loading'`, `'error'`, etc.).
- **Props**: None.

### `GeneratedPressReviewList.tsx`

- **Description**: A presentational component that receives and displays the list of generated press reviews.
- **Main Elements**: Maps over the `reviews` prop and renders a `GeneratedPressReviewListItem` for each item.
- **Interactions**:
  - Handles the `onSelect` event for a list item and propagates it to the parent `ArchiveView`.
- **Validation**: None.
- **Types**: `ArchiveViewModel[]`.
- **Props**:
  ```typescript
  interface GeneratedPressReviewListProps {
    reviews: ArchiveViewModel[];
    onSelectReview: (review: ArchiveViewModel) => void;
  }
  ```

### `GeneratedPressReviewListItem.tsx`

- **Description**: Renders a single row in the archive list, displaying key information about one generated press review.
- **Main Elements**: Contains the review topic, the generation date, and a `Badge` component for the status. The entire item is clickable.
- **Interactions**:
  - Emits an `onClick` event, calling the `onSelectReview` prop.
- **Validation**: None.
- **Types**: `ArchiveViewModel`.
- **Props**:
  ```typescript
  interface GeneratedPressReviewListItemProps {
    review: ArchiveViewModel;
    onSelectReview: (review: ArchiveViewModel) => void;
  }
  ```

### `GeneratedPressReviewContentDialog.tsx`

- **Description**: A modal dialog to display the full content of a selected press review.
- **Main Elements**: Uses Shadcn/ui's `Dialog` component. It renders the `general_summary` and then maps over the `segments` to display each title, summary, and a link to the source.
- **Interactions**:
  - Handles the `onOpenChange` event to close the dialog.
- **Validation**: Safely parses and renders the `content` JSON.
- **Types**: `ArchiveViewModel | null`, `PressReviewContent`.
- **Props**:
  ```typescript
  interface GeneratedPressReviewContentDialogProps {
    review: ArchiveViewModel | null;
    onOpenChange: (isOpen: boolean) => void;
  }
  ```

## 5. Types

To support the view, existing DTOs will be used, and new ViewModel and content types will be defined.

**NOTE**: The following types assume a backend modification to the `GET /api/generated_press_reviews` endpoint to include the `topic` from the parent `press_reviews` table.

```typescript
// --- In src/types.ts ---

// Expected structure of the 'content' JSONB field
export interface ContentSegment {
  title: string;
  summary: string;
  link: string;
}

export interface PressReviewContent {
  general_summary: string;
  segments: ContentSegment[];
}

// Modified DTO from API to include the topic
export type GeneratedPressReviewWithTopicDTO = GeneratedPressReviewDTO & {
  press_reviews: {
    topic: string;
  } | null;
};

// ViewModel for the Archive View components
export type ArchiveViewModel = GeneratedPressReviewWithTopicDTO;

// API Response Type for the list
export interface GeneratedPressReviewsListWithTopicDTO {
  data: GeneratedPressReviewWithTopicDTO[];
  count: number;
}
```

_`GeneratedPressReviewDTO` already exists in `src/types.ts` and will be used as a base._

## 6. State Management

All client-side state will be managed within a custom React hook, `useArchive`. This hook will encapsulate the logic for data fetching, polling, and managing the view's state.

### `useArchive.ts`

- **State**:
  - `reviews: ArchiveViewModel[]`: List of fetched reviews.
  - `status: 'loading' | 'success' | 'error'`: The current fetch status.
  - `selectedReview: ArchiveViewModel | null`: The review selected for dialog view.
- **Exposed Functions**:
  - `retry()`: Re-triggers the initial data fetch.
  - `selectReview(review: ArchiveViewModel)`: Sets the selected review.
  - `clearSelection()`: Clears the selected review.
- **Internal Logic**:
  - Fetches data on mount.
  - Implements a polling mechanism using `setInterval` that activates only when there are reviews with a `'pending'` status. The polling interval will be cleared on unmount or when no reviews are pending.

## 7. API Integration

The view will integrate with a single backend endpoint.

- **Endpoint**: `GET /api/generated_press_reviews`
- **Action**: The `useArchive` hook will call this endpoint to fetch the list of reviews.
- **Request**: No request body. Query parameters are not needed for the main view but can be used for filtering in the future.
- **Response Type**: `Promise<GeneratedPressReviewsListWithTopicDTO>`
- **Polling**: If the response contains any items with `status: 'pending'`, the hook will periodically re-fetch from this endpoint until all pending items are resolved.

## 8. User Interactions

- **Page Load**: User navigates to `/archive`. The UI shows a loading state, then displays the list of reviews sorted chronologically. If a review is pending, its status will update automatically without user interaction.
- **View Content**: User clicks on any item in the list. A modal dialog appears, displaying the formatted content of that review.
- **Close Content**: User clicks the 'X' button on the dialog or clicks the overlay. The dialog closes.
- **Fetch Error**: If the initial data fetch fails, an error message is shown with a "Retry" button. Clicking it re-attempts the fetch.

## 9. Conditions and Validation

- The frontend will not perform any input validation as there is no user input.
- **Data Presence**: The UI will check if the fetched `data` array is empty. If `count` is 0, it will render an `EmptyState` component.
- **Status Rendering**: The `Badge` component's appearance will be conditional on the `review.status` property (`'pending'`, `'successful'`, `'failed'`).
- **Content Display**: The dialog will only attempt to render content if `review.status` is `'successful'`. For other statuses, it will show an appropriate message (e.g., "Generation failed.").

## 10. Error Handling

- **API Fetch Failure**: Any network error or non-2xx response from the API will be caught. The UI state will be set to `'error'`, and a component with an error message and a "Retry" button will be displayed.
- **Empty State**: A successful API call that returns an empty array (`count: 0`) is not an error but a specific state. The UI will render a friendly message indicating that no reviews have been generated yet.
- **Content Parsing Error**: The `GeneratedPressReviewContentDialog` will wrap the `content` rendering in a boundary to catch any issues with malformed JSON, displaying a "Could not display content" message if parsing or rendering fails.

## 11. Implementation Steps

1.  **Layout**: Create a new `Header.astro` component in `src/components/layout/` with navigation links to "Dashboard" (`/`) and "Archive" (`/archive`).
2.  **Layout**: Update `src/layouts/Layout.astro` to include the new `Header.astro` component.
3.  **Backend**: Update the `GET /api/generated_press_reviews` endpoint to join `press_reviews` and include the `topic`.
4.  **Types**: Add the new type definitions (`ContentSegment`, `PressReviewContent`, `GeneratedPressReviewWithTopicDTO`, `ArchiveViewModel`) to `src/types.ts`.
5.  **Page**: Create the Astro page `src/pages/archive.astro`. Import and render the main `ArchiveView` component with a `client:load` directive.
6.  **Hook**: Implement the `useArchive` custom hook to handle all state management, data fetching, and polling logic.
7.  **Components**:
    - Create the main `ArchiveView.tsx` component. It will use the `useArchive` hook and handle conditional rendering (loader, error, empty, list).
    - Create the `GeneratedPressReviewList.tsx` presentational component.
    - Create the `GeneratedPressReviewListItem.tsx` component, including the `Badge` for status.
    - Create the `GeneratedPressReviewContentDialog.tsx` to display the formatted `content`.
8.  **Styling**: Apply Tailwind CSS classes to all new components to match the application's design system.
9.  **Integration**: Connect all components, passing props and callbacks as defined, ensuring the `ArchiveView` correctly orchestrates the user experience.
