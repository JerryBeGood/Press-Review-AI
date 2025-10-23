# Plan implementacji widoku Pulpit (Dashboard)

## 1. Przegląd

Widok pulpitu (Dashboard) jest głównym interfejsem aplikacji po zalogowaniu użytkownika. Jego celem jest umożliwienie użytkownikom zarządzania cyklicznymi prasówkami. Widok wyświetla listę istniejących prasówek, pozwala na ich tworzenie, edycję, usuwanie oraz ręczne generowanie. W przypadku braku prasówek, widok prezentuje stan pusty z wyraźnym wezwaniem do działania (CTA), zachęcającym do stworzenia pierwszej prasówki.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji:

- **Ścieżka:** `/`

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w oparciu o React i bibliotekę Shadcn/ui. Hierarchia komponentów będzie wyglądać następująco:

```
- DashboardView (Komponent strony Astro, renderujący komponent React)
  - PressReviewList
    - PressReviewListItem[]
      - Button (Edytuj)
      - Button (Usuń)
      - Button (Generuj teraz)
  - EmptyState (wyświetlany warunkowo)
    - Button (Stwórz pierwszą prasówkę)
  - PressReviewFormDialog (okno modalne)
  - DeleteConfirmationDialog (okno modalne)
```

## 4. Szczegóły komponentów

### `DashboardView`

- **Opis komponentu:** Główny komponent-kontener dla widoku pulpitu. Odpowiedzialny za pobieranie danych, zarządzanie stanem (ładowanie, błędy, lista prasówek) oraz renderowanie odpowiednich komponentów podrzędnych (`PressReviewList` lub `EmptyState`). Zarządza również widocznością okien modalnych.
- **Główne elementy:** Kontener `div`, komponent `PressReviewList` lub `EmptyState`.
- **Obsługiwane interakcje:** Otwieranie modala `PressReviewFormDialog` w trybie tworzenia lub edycji, otwieranie modala `DeleteConfirmationDialog`.
- **Obsługiwana walidacja:** Sprawdzenie, czy użytkownik osiągnął limit 5 prasówek i zablokowanie możliwości dodawania nowej.
- **Typy:** `PressReviewViewModel[]`
- **Propsy:** Brak.

### `PressReviewList`

- **Opis komponentu:** Wyświetla listę zaplanowanych prasówek lub komponenty `Skeleton` w trakcie ładowania danych.
- **Główne elementy:** Lista (`ul` lub `div`) renderująca komponenty `PressReviewListItem`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji; przekazuje obsługę zdarzeń do `PressReviewListItem`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PressReviewViewModel[]`
- **Propsy:**
  - `pressReviews: PressReviewViewModel[]` - Lista prasówek do wyświetlenia.
  - `isLoading: boolean` - Status ładowania.
  - `onEdit: (pressReview: PressReviewViewModel) => void` - Funkcja zwrotna wywoływana po kliknięciu "Edytuj".
  - `onDelete: (id: string) => void` - Funkcja zwrotna wywoływana po kliknięciu "Usuń".
  - `onGenerate: (id: string) => void` - Funkcja zwrotna wywoływana po kliknięciu "Generuj teraz".

### `EmptyState`

- **Opis komponentu:** Wyświetlany, gdy lista prasówek jest pusta. Jego celem jest poinformowanie użytkownika o braku danych i zachęcenie go do podjęcia pierwszej akcji poprzez wyraźny przycisk "Stwórz pierwszą prasówkę" (Call To Action). Poprawia to doświadczenie nowych użytkowników, zapobiegając wrażeniu "pustej" lub niedziałającej aplikacji.
- **Główne elementy:** Kontener `div` z tekstem informacyjnym i komponentem `Button`.
- **Obsługiwane interakcje:** Kliknięcie przycisku CTA, które sygnalizuje `DashboardView` konieczność otwarcia modala `PressReviewFormDialog`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `onCreateFirst: () => void` - Funkcja zwrotna wywoływana po kliknięciu przycisku.

### `PressReviewListItem`

- **Opis komponentu:** Reprezentuje pojedynczy element na liście prasówek. Wyświetla temat, harmonogram oraz przyciski akcji. Wskazuje wizualnie stan (`deleting`, `generating`).
- **Główne elementy:** Element listy (`li` lub `div`), `span` dla tematu i harmonogramu, `Button` dla akcji z odpowiednimi ikonami i etykietami `aria-label`.
- **Obsługiwane interakcje:** Kliknięcie przycisków "Edytuj", "Usuń", "Generuj teraz".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PressReviewViewModel`
- **Propsy:**
  - `pressReview: PressReviewViewModel` - Dane pojedynczej prasówki.
  - `onEdit: (pressReview: PressReviewViewModel) => void`
  - `onDelete: (id: string) => void`
  - `onGenerate: (id: string) => void`

### `PressReviewFormDialog`

- **Opis komponentu:** Okno modalne z formularzem do tworzenia i edycji prasówki. Zawiera pole na temat oraz uproszczony selektor harmonogramu (np. dropdowny "Częstotliwość" i "Godzina"). Waliduje temat w czasie rzeczywistym.
- **Główne elementy:** Komponenty `Dialog`, `Form`, `Input`, `Select` z biblioteki Shadcn/ui.
- **Obsługiwane interakcje:** Wprowadzanie tematu, zmiana harmonogramu, wysłanie formularza.
- **Obsługiwana walidacja:**
  - Pole `topic` nie może być puste.
  - Pole `topic` jest walidowane w czasie rzeczywistym (z debouncingiem) przez API.
  - Przycisk zapisu jest nieaktywny, jeśli temat jest nieprawidłowy lub walidacja jest w toku.
- **Typy:** `CreatePressReviewCmd`, `UpdatePressReviewCmd`, `ValidateTopicResultDTO`
- **Propsy:**
  - `isOpen: boolean` - Kontroluje widoczność modala.
  - `onClose: () => void` - Funkcja zwrotna do zamknięcia modala.
  - `onSubmit: (data: CreatePressReviewCmd | UpdatePressReviewCmd) => Promise<void>` - Funkcja do obsługi wysłania formularza.
  - `initialData?: PressReviewDTO` - Dane do pre-wypełnienia formularza w trybie edycji.

### `DeleteConfirmationDialog`

- **Opis komponentu:** Proste okno modalne (`AlertDialog`) z prośbą o potwierdzenie usunięcia prasówki.
- **Główne elementy:** Komponent `AlertDialog` z Shadcn/ui.
- **Obsługiwane interakcje:** Potwierdzenie lub anulowanie operacji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => void`

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO oraz wprowadzone zostaną nowe typy ViewModel do obsługi stanu UI.

- **`PressReviewDTO` (istniejący):** Podstawowy obiekt transferu danych dla prasówki.

  ```typescript
  // from src/types.ts
  export type PressReviewDTO = Omit<Tables<"press_reviews">, "user_id">;
  ```

- **`PressReviewViewModel` (nowy):** Rozszerza `PressReviewDTO` o opcjonalny stan UI, co pozwoli na realizację optymistycznych aktualizacji.

  ```typescript
  export type PressReviewViewModel = PressReviewDTO & {
    status?: "deleting" | "generating";
  };
  ```

- **`CreatePressReviewCmd`, `UpdatePressReviewCmd`, `ValidateTopicResultDTO` (istniejące):** Wykorzystywane do komunikacji z API.

## 6. Zarządzanie stanem

Zarządzanie stanem zostanie scentralizowane w niestandardowym hooku `usePressReviews`, co zapewni separację logiki od prezentacji.

- **Hook `usePressReviews`:**
  - **Cel:** Abstrakcja nad logiką pobierania, dodawania, aktualizacji i usuwania prasówek.
  - **Zarządzany stan:**
    - `pressReviews: PressReviewViewModel[]`
    - `isLoading: boolean`
    - `error: Error | null`
  - **Udostępniane funkcje:**
    - `addPressReview(data: CreatePressReviewCmd)`
    - `updatePressReview(id: string, data: UpdatePressReviewCmd)`
    - `deletePressReview(id: string)` - implementuje logikę optymistycznego UI.
    - `generatePressReview(id: string)`

## 7. Integracja API

Integracja z API będzie realizowana poprzez wywołania `fetch` do odpowiednich endpointów z poziomu hooka `usePressReviews`.

- **`GET /api/press_reviews`**
  - **Typ odpowiedzi:** `PressReviewsListDTO`
- **`POST /api/press_reviews`**
  - **Typ żądania:** `CreatePressReviewCmd`
  - **Typ odpowiedzi:** `PressReviewDTO`
- **`PATCH /api/press_reviews/{id}`**
  - **Typ żądania:** `UpdatePressReviewCmd`
  - **Typ odpowiedzi:** `PressReviewDTO`
- **`DELETE /api/press_reviews/{id}`**
  - **Odpowiedź:** `204 No Content`
- **`POST /api/generated_press_reviews`**
  - **Typ żądania:** `{ press_review_id: string }`
  - **Odpowiedź:** `202 Accepted`
- **`POST /api/press_reviews/validate_topic`** (_Uwaga: ten endpoint musi zostać zaimplementowany w backendzie_)
  - **Typ żądania:** `ValidateTopicCmd`
  - **Typ odpowiedzi:** `ValidateTopicResultDTO`

## 8. Interakcje użytkownika

- **Wyświetlanie listy:** Po załadowaniu widoku, użytkownik widzi szkielety interfejsu, a następnie listę prasówek lub stan pusty.
- **Tworzenie prasówki:** Użytkownik klika "Stwórz prasówkę", co otwiera modal. Wprowadza temat (walidowany na bieżąco), wybiera harmonogram i zapisuje. Modal się zamyka, a nowa prasówka pojawia się na liście.
- **Edycja prasówki:** Użytkownik klika "Edytuj", co otwiera modal z wypełnionymi danymi. Po zapisaniu zmian, dane na liście są aktualizowane.
- **Usuwanie prasówki:** Użytkownik klika "Usuń", co otwiera modal potwierdzający. Po potwierdzeniu, element na liście jest natychmiastowo oznaczany jako "usuwany" (np. zmienia styl), a po pomyślnej odpowiedzi API znika z listy.
- **Generowanie na żądanie:** Użytkownik klika "Generuj teraz". Wyświetlane jest powiadomienie (toast) o rozpoczęciu generowania.

## 9. Warunki i walidacja

- **Limit prasówek:** Przycisk "Dodaj nową prasówkę" jest nieaktywny, jeśli `pressReviews.length >= 5`. Dodatkowo wyświetlany jest komunikat informacyjny.
- **Walidacja formularza:** Przycisk zapisu w `PressReviewFormDialog` jest nieaktywny, jeśli:
  - Pole tematu jest puste.
  - Trwa proces walidacji tematu przez API.
  - Walidacja API zwróciła `is_valid: false`.
- **Unikalność tematu:** Błąd `409 Conflict` z API podczas tworzenia/edycji jest przechwytywany i wyświetlany jako błąd walidacji w formularzu.

## 10. Obsługa błędów

- **Błąd pobierania listy:** W miejscu listy wyświetlany jest komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błędy API w formularzu (4xx):** Błędy (np. o duplikacie tematu, przekroczeniu limitu) są wyświetlane bezpośrednio w `PressReviewFormDialog`.
- **Błędy sieciowe / serwera (5xx):** Wyświetlane są globalne powiadomienia (toasty) informujące o problemie.
- **Niepowodzenie operacji optymistycznej (np. usunięcie):** Element na liście wraca do normalnego stanu, a użytkownik otrzymuje powiadomienie (toast) o niepowodzeniu operacji.

## 11. Kroki implementacji

1.  **Struktura plików:** Stworzyć pliki dla nowych komponentów React w katalogu `src/components/dashboard/`: `DashboardView.tsx`, `PressReviewList.tsx`, `PressReviewListItem.tsx`, `PressReviewFormDialog.tsx`, `DeleteConfirmationDialog.tsx`, `EmptyState.tsx`.
2.  **Typy i hook:** Zdefiniować typ `PressReviewViewModel` w `src/types.ts` oraz zaimplementować hook `usePressReviews` w `src/lib/hooks/`.
3.  **Komponenty szkieletu i stanu pustego:** Zbudować komponent `PressReviewList` z obsługą stanu ładowania (wyświetlanie `Skeleton`) oraz komponent `EmptyState`.
4.  **Implementacja listy:** Zbudować `PressReviewListItem` wyświetlający dane i przyciski akcji. Zintegrować go z `PressReviewList`.
5.  **Implementacja formularza:** Zbudować `PressReviewFormDialog`, w tym logikę walidacji tematu w czasie rzeczywistym z użyciem debouncingu.
6.  **Integracja w `DashboardView`:** Połączyć wszystkie komponenty w `DashboardView.tsx`, zaimplementować logikę zarządzania stanem za pomocą hooka `usePressReviews` oraz sterowanie modalem.
7.  **Strona Astro:** Zaktualizować stronę `src/pages/index.astro`, aby renderowała komponent `DashboardView.tsx` i przekazywała mu odpowiednie dane (np. sesję użytkownika, jeśli jest to wymagane).
8.  **Stylowanie i testowanie:** Dodać finalne szlify w Tailwind CSS, zapewnić responsywność i przetestować wszystkie interakcje użytkownika oraz obsługę błędów.
