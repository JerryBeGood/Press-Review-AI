# API Endpoint Implementation Plan: `GET /generated_press_reviews`

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie listy wygenerowanych przeglądów prasowych dla domyślnego użytkownika deweloperskiego. Umożliwia filtrowanie wyników na podstawie identyfikatora nadrzędnego przeglądu prasy oraz statusu generacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/generated_press_reviews`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `press_review_id` (string, format: uuid): Filtruje listę do przeglądów należących do określonego nadrzędnego `press_review`.
    - `status` (string, enum): Filtruje listę na podstawie statusu. Dozwolone wartości: `pending`, `success`, `failed`.
- **Request Body**: Brak (N/A)

## 3. Wykorzystywane typy

- **`GeneratedPressReviewDTO`** (`src/types.ts`): Reprezentuje pojedynczy wygenerowany przegląd prasowy w odpowiedzi.
- **`GeneratedPressReviewsListDTO`** (`src/types.ts`): Definiuje ogólną strukturę odpowiedzi JSON, zawierającą pola `data` i `count`.
- **`PressReviewStatus`** (`src/types.ts`): Typ enum używany do walidacji parametru zapytania `status`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt zawierający listę wygenerowanych przeglądów i ich całkowitą liczbę.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "press_review_id": "uuid",
        "generated_at": "timestamptz | null",
        "status": "pending | success | failed",
        "content": "jsonb | null"
      }
    ],
    "count": "integer"
  }
  ```
- **Odpowiedzi błędów**:
  - **`400 Bad Request`**: Zwracany, gdy parametry zapytania są nieprawidłowe (np. zły format UUID, niedozwolona wartość statusu).
  - **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów po stronie serwera.

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/generated_press_reviews`, opcjonalnie dołączając parametry `press_review_id` i `status`.
2. Handler API w Astro (`src/pages/api/generated_press_reviews.ts`) odbiera żądanie.
3. Handler API importuje `DEFAULT_USER_ID` z `src/db/supabase.client.ts`.
4. Handler waliduje parametry zapytania (`press_review_id`, `status`) przy użyciu predefiniowanego schematu Zod. W przypadku błędu walidacji zwraca `400 Bad Request`.
5. Handler wywołuje nową funkcję `getGeneratedPressReviews` z serwisu `GeneratedPressReviewService` (`src/lib/services/generatedPressReviewService.ts`), przekazując instancję klienta Supabase, `DEFAULT_USER_ID` oraz zwalidowane filtry.
6. Funkcja w serwisie buduje i wykonuje zapytanie do tabeli `generated_press_reviews` w Supabase. Zapytanie musi zawierać klauzulę `WHERE` filtrującą po `user_id`, a także opcjonalnie po `press_review_id` i `status`.
7. Serwis zwraca pobrane dane (listę przeglądów i ich liczbę) do handlera.
8. Handler formatuje dane zgodnie ze strukturą `GeneratedPressReviewsListDTO` i odsyła odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: **UWAGA!** W tej implementacji mechanizm uwierzytelniania jest celowo pominięty na rzecz stałego, deweloperskiego ID użytkownika (`DEFAULT_USER_ID`). To podejście jest przeznaczone **wyłącznie** do celów deweloperskich i testowych.
- **Autoryzacja**: Każde zapytanie do bazy danych jest powiązane ze stałym `DEFAULT_USER_ID`. W środowisku produkcyjnym to rozwiązanie musi zostać zastąpione przez dynamiczne pobieranie ID zalogowanego użytkownika z sesji w celu zapewnienia izolacji danych.
- **Walidacja danych wejściowych**: Parametry zapytania muszą być rygorystycznie walidowane za pomocą Zod, aby uniknąć błędów i potencjalnych wektorów ataku.

## 7. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Należy upewnić się, że kolumny `user_id`, `press_review_id` i `status` w tabeli `generated_press_reviews` są zaindeksowane. Przyspieszy to znacznie wykonywanie zapytań, zwłaszcza przy dużej ilości danych.
- **Paginacja**: Obecna specyfikacja nie wymaga paginacji, jednak należy ją rozważyć w przyszłości (`limit`, `offset`), aby uniknąć pobierania bardzo dużych zbiorów danych i zapewnić skalowalność rozwiązania.

## 8. Etapy wdrożenia

1. **Utworzenie handlera API**:
   - Stwórz nowy plik `src/pages/api/generated_press_reviews.ts`.
   - Zdefiniuj w nim `GET` handler, który będzie realizował logikę opisaną w sekcji "Przepływ danych".
   - `export const prerender = false;` musi być ustawione.

2. **Implementacja walidacji**:
   - W pliku handlera zdefiniuj schemat walidacji Zod dla parametrów `press_review_id` (jako `z.string().uuid().optional()`) i `status` (jako `z.enum([...]).optional()`).
   - Zaimplementuj logikę walidacji przychodzących parametrów zapytania.

3. **Aktualizacja serwisu `GeneratedPressReviewService`**:
   - W pliku `src/lib/services/generatedPressReviewService.ts` dodaj nową funkcję asynchroniczną `getGeneratedPressReviews`.
   - Funkcja powinna przyjmować jako argumenty klienta Supabase, `userId` oraz obiekt z opcjonalnymi filtrami (`pressReviewId`, `status`).
   - Wewnątrz funkcji zaimplementuj zapytanie do Supabase, używając `.select()` do pobrania danych oraz `.eq()` do filtrowania.
   - Zapewnij obsługę błędów na poziomie zapytania do bazy danych.

4. **Połączenie handlera z serwisem**:
   - W handlerze API, po pomyślnej walidacji, wywołaj nowo utworzoną funkcję `getGeneratedPressReviews`.
   - Przekaż odpowiednie argumenty, w tym `DEFAULT_USER_ID` zaimportowane z `src/db/supabase.client.ts`.
   - Obsłuż odpowiedź z serwisu (zarówno dane, jak i ewentualne błędy) i zwróć odpowiednią odpowiedź HTTP do klienta.
