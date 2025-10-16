# API Endpoint Implementation Plan: DELETE /press-reviews/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za trwałe usunięcie istniejącego przeglądu prasy na podstawie jego unikalnego identyfikatora (`id`). Operacja wymaga uwierzytelnienia, a użytkownik może usunąć wyłącznie własne zasoby. Pomyślne usunięcie zasobu skutkuje odpowiedzią bez treści.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/press-reviews/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator przeglądu prasy w formacie UUID.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Implementacja tego punktu końcowego nie wymaga tworzenia nowych typów DTO ani Command Models, ponieważ żądanie nie zawiera ciała (body). Walidacji podlega jedynie parametr `id` ze ścieżki URL.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Treść**: Pusta.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Przekazany parametr `id` ma nieprawidłowy format.
  - `404 Not Found`: Przegląd prasy o podanym `id` nie został znaleziony lub użytkownik nie ma do niego uprawnień.
  - `500 Internal Server Error`: Wystąpił nieoczekiwany błąd serwera.

## 5. Przepływ danych

1. Klient wysyła żądanie `DELETE` na adres `/api/press-reviews/{id}`.
2. Handler API w `src/pages/api/press_reviews/[id].ts` jest wywoływany.
3. Handler pobiera `id` z `Astro.params`.
4. Na potrzeby developmentu, handler importuje i wykorzystuje stałą `DEFAULT_USER_ID` z `src/db/supabase.client.ts` jako identyfikator użytkownika.
5. Parametr `id` jest walidowany przy użyciu `zod` w celu sprawdzenia, czy jest to poprawny UUID. W przypadku błędu walidacji zwracany jest status `400 Bad Request`.
6. Handler wywołuje metodę `deletePressReview` z serwisu `pressReviewService`, przekazując `id` oraz `DEFAULT_USER_ID`.
7. Metoda `deletePressReview` w `src/lib/services/pressReviewService.ts` używa klienta Supabase do wykonania zapytania `DELETE` do tabeli `press_reviews`.
8. Zapytanie SQL zawiera klauzulę `WHERE`, która filtruje zarówno po `id` przeglądu, jak i `user_id`, aby zapewnić, że użytkownicy mogą usuwać tylko swoje zasoby.
9. Serwis analizuje wynik operacji usunięcia. Jeśli liczba usuniętych wierszy wynosi 0, oznacza to, że zasób nie istnieje lub nie należy do użytkownika, i zwraca informację o niepowodzeniu.
10. Handler API, na podstawie odpowiedzi z serwisu, zwraca do klienta odpowiedni status HTTP: `204 No Content` w przypadku sukcesu lub `404 Not Found` w przypadku nieznalezienia zasobu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: **W fazie deweloperskiej uwierzytelnianie jest pomijane, a operacje są wykonywane w imieniu zmockowanego użytkownika (`DEFAULT_USER_ID`). W docelowym rozwiązaniu dostęp do punktu końcowego musi być chroniony przez middleware, które weryfikuje sesję użytkownika.**
- **Autoryzacja**: Kluczowym elementem jest zapewnienie, że użytkownik może usunąć tylko własne przeglądy prasy. Musi to być zrealizowane poprzez dodanie warunku `WHERE user_id = :userId` do zapytania `DELETE` w bazie danych.
- **Walidacja danych wejściowych**: Parametr `id` musi być rygorystycznie walidowany jako UUID, aby zapobiec błędom zapytań i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK parametryzuje zapytania).
- **Zapobieganie wyciekowi informacji**: Zwracanie statusu `404 Not Found` zarówno w przypadku, gdy zasób nie istnieje, jak i gdy należy do innego użytkownika, jest dobrą praktyką, która zapobiega możliwości odgadnięcia istnienia zasobów przez osoby nieuprawnione (IDOR).

## 7. Rozważania dotyczące wydajności

- Operacja `DELETE` jest wykonywana na kluczu głównym (`id`), co jest bardzo wydajne.
- Klauzula `WHERE` wykorzystuje również `user_id`, który jako klucz obcy jest domyślnie indeksowany w PostgreSQL.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku endpointa**:
    - Stwórz nowy plik: `src/pages/api/press_reviews/[id].ts`.
    - Dodaj w nim `export const prerender = false;`.
2.  **Rozszerzenie serwisu `pressReviewService`**:
    - W pliku `src/lib/services/pressReviewService.ts` dodaj nową asynchroniczną metodę `deletePressReview(id: string, userId: string)`.
    - Wewnątrz metody zaimplementuj logikę usuwania rekordu z bazy danych za pomocą klienta Supabase, uwzględniając warunki na `id` i `userId`.
    - Metoda powinna zwracać informację o powodzeniu operacji (np. `boolean` lub obiekt z wynikiem).
3.  **Implementacja handlera `DELETE`**:
    - W pliku `src/pages/api/press_reviews/[id].ts` zaimplementuj handler dla metody `DELETE`.
    - Pobierz obiekt `Astro` z kontekstu.
    - **Zaimportuj `DEFAULT_USER_ID` z `src/db/supabase.client.ts`.**
    - Pobierz `id` z `Astro.params`.
    - Zwaliduj `id` za pomocą `zod` (`z.string().uuid()`). W razie błędu zwróć `400 Bad Request`.
    - Wywołaj metodę `pressReviewService.deletePressReview` z `id` i `DEFAULT_USER_ID`.
    - Na podstawie wyniku zwróconego przez serwis, zwróć odpowiedź `204 No Content` lub `404 Not Found`.
    - Dodaj obsługę nieoczekiwanych błędów (blok `try...catch`) i zwróć `500 Internal Server Error`.
