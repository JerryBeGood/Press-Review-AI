<!-- e5a9b069-3a23-4af6-ab47-f105a67b95d0 40a13ca8-f106-4da9-acca-73ebd9bc2b9b -->

# Plan wdrożenia punktu końcowego API: Aktualizacja recenzji prasowej

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie aktualizacji istniejącej recenzji prasowej (`press_review`) poprzez jej unikalny identyfikator (`id`). Użytkownicy mogą modyfikować temat (`topic`) i/lub harmonogram (`schedule`). W wersji deweloperskiej punkt końcowy będzie używał `DEFAULT_USER_ID` zamiast uwierzytelniania użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/press_reviews/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): UUID recenzji prasowej do zaktualizowania.
  - **Opcjonalne**:
    - `topic` (w ciele żądania): Nowy temat dla recenzji prasowej.
    - `schedule` (w ciele żądania): Nowy harmonogram w formacie CRON.
- **Request Body**:
  ```json
  {
    "topic": "Nowe technologie w AI",
    "schedule": "0 8 * * 1-5"
  }
  ```
  _Uwaga: Przynajmniej jedno z pól (`topic` lub `schedule`) musi być obecne w ciele żądania._

## 3. Wykorzystywane typy

- **Command Model**: `UpdatePressReviewCmd` z `src/types.ts` będzie używany do walidacji przychodzącego ciała żądania.
- **DTO**: `PressReviewDTO` z `src/types.ts` zostanie użyty do strukturyzacji odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca zaktualizowany obiekt recenzji prasowej.
  ```json
  {
    "id": "uuid",
    "topic": "string",
    "schedule": "string (cron format)",
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
  ```

## 5. Przepływ danych

1.  Żądanie `PATCH` jest wysyłane na adres `/api/press_reviews/{id}`.
2.  Handler API w `src/pages/api/press_reviews/[id].ts` odbiera żądanie.
3.  Identyfikator `id` ze ścieżki URL jest walidowany jako UUID.
4.  Ciało żądania jest walidowane za pomocą schematu Zod zdefiniowanego w `src/lib/schemas/api.schemas.ts`. Schemat sprawdza, czy `topic` jest ciągiem znaków, a `schedule` jest prawidłowym wyrażeniem CRON, i czy co najmniej jedno z nich jest obecne.
5.  Handler wywołuje funkcję `updatePressReview` z serwisu `src/lib/services/pressReviewService.ts`.
6.  Funkcja `updatePressReview` wykonuje zapytanie `UPDATE` do tabeli `press_reviews` w bazie danych Supabase, używając klauzul `WHERE` do dopasowania zarówno `id`, jak i `user_id` (używając `DEFAULT_USER_ID`). Pole `updated_at` jest automatycznie aktualizowane.
7.  Jeśli aktualizacja powiedzie się i zostanie zwrócony zaktualizowany wiersz, serwis zwraca dane jako `PressReviewDTO`.
8.  Handler API zwraca `PressReviewDTO` z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: W wersji deweloperskiej uwierzytelnianie jest pominięte. Punkt końcowy używa `DEFAULT_USER_ID` z pliku `src/db/supabase.client.ts` do identyfikacji użytkownika.
- **Autoryzacja**: Wszystkie operacje są wykonywane w kontekście `DEFAULT_USER_ID`. Zapytanie `UPDATE` w `pressReviewService` będzie zawierać warunek `WHERE user_id = DEFAULT_USER_ID`. Jeśli zapytanie nie znajdzie pasującego wiersza (ponieważ `id` jest nieprawidłowe lub nie należy do domyślnego użytkownika), zostanie zwrócony błąd `404 Not Found`.
- **Walidacja danych wejściowych**: Wszystkie dane wejściowe (`id` ze ścieżki i ciało żądania) będą rygorystycznie walidowane za pomocą Zod, aby zapobiec atakom, takim jak SQL Injection, oraz zapewnić integralność danych.

## 7. Obsługa błędów

- **`400 Bad Request`**:
  - `id` w adresie URL nie jest prawidłowym UUID.
  - Ciało żądania jest puste lub nie zawiera ani `topic`, ani `schedule`.
  - Wartość `schedule` nie jest prawidłowym wyrażeniem CRON.
- **`404 Not Found`**:
  - Recenzja prasowa o podanym `id` nie istnieje lub nie należy do domyślnego użytkownika (`DEFAULT_USER_ID`).
- **`500 Internal Server Error`**:
  - Wystąpił błąd podczas komunikacji z bazą danych lub inny nieoczekiwany błąd serwera.

## 8. Etapy wdrożenia

1.  **Aktualizacja schematów walidacji**:
    - W pliku `src/lib/schemas/api.schemas.ts` dodaj nowy schemat Zod dla `UpdatePressReviewCmd`, który waliduje opcjonalne pola `topic` i `schedule` (z walidacją formatu CRON) i zapewnia, że co najmniej jedno z nich jest obecne.

2.  **Rozszerzenie serwisu**:
    - W pliku `src/lib/services/pressReviewService.ts` utwórz nową funkcję asynchroniczną `updatePressReview(id: string, data: UpdatePressReviewCmd, supabase: SupabaseClient)`.
    - Wewnątrz funkcji zaimplementuj logikę aktualizacji rekordu w tabeli `press_reviews`, upewniając się, że zapytanie zawiera warunki `WHERE` dla `id` i `user_id = DEFAULT_USER_ID`.
    - Funkcja powinna zwracać zaktualizowany obiekt `PressReviewDTO` lub rzucać błąd, jeśli rekord nie został znaleziony.

3.  **Implementacja handlera API**:
    - Utwórz nowy plik `src/pages/api/press_reviews/[id].ts`.
    - Zaimplementuj handler dla metody `PATCH`.
    - Pobierz `id` z `Astro.params` i `supabase` z `Astro.locals`.
    - Zwaliduj `id` jako UUID.
    - Zwaliduj ciało żądania za pomocą nowo utworzonego schematu Zod.
    - Wywołaj funkcję `pressReviewService.updatePressReview` z odpowiednimi parametrami (używając `DEFAULT_USER_ID`).
    - Obsłuż potencjalne błędy (np. błędy walidacji, `404 Not Found`) i zwróć odpowiednie kody statusu.
    - W przypadku sukcesu, zwróć zaktualizowany obiekt z kodem statusu `200 OK`.

4.  **Konfiguracja `prerender`**:
    - W pliku `src/pages/api/press_reviews/[id].ts` dodaj `export const prerender = false;`, aby zapewnić, że punkt końcowy jest renderowany dynamicznie na serwerze.
