<!-- f5ce137a-3399-4a71-bacc-563047fa7410 48b58d3a-9ded-45c7-805a-0b8496896295 -->

# API Endpoint Implementation Plan: POST /press-reviews

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom tworzenia nowych przeglądów prasy. Endpoint będzie przyjmował temat oraz harmonogram w formacie CRON, a po pomyślnym utworzeniu zwróci nowo utworzony obiekt.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/press-reviews`
- **Parametry**: Brak
- **Request Body**:
  ```json
  {
    "topic": "string",
    "schedule": "string (cron format)"
  }
  ```

## 3. Wykorzystywane typy

- `CreatePressReviewCmd` (`src/types.ts`): Model polecenia używany do walidacji i przekazywania danych wejściowych.
- `PressReviewDTO` (`src/types.ts`): Obiekt transferu danych używany w odpowiedzi na pomyślne utworzenie zasobu.

## 4. Przepływ danych

1.  Żądanie `POST` trafia do pliku `src/pages/api/press-reviews.ts`.
2.  Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika i udostępnia jego dane w `Astro.locals.user`.
3.  Handler API waliduje ciało żądania (poprawność schematu i formatu CRON) przy użyciu biblioteki `zod`.
4.  Handler wywołuje metodę `createPressReview(cmd, userId)` z nowo utworzonego serwisu `PressReviewService`.
5.  `PressReviewService` wykonuje operację `insert` w tabeli `press_reviews` za pomocą klienta Supabase.
6.  Trigger w bazie danych PostgreSQL weryfikuje przed wstawieniem, czy użytkownik nie przekroczył limitu 5 zaplanowanych przeglądów. W przypadku przekroczenia limitu, baza danych zwraca błąd.
7.  Po pomyślnym wstawieniu danych, serwis zwraca nowo utworzony obiekt do handlera API.
8.  Handler API formatuje odpowiedź jako `PressReviewDTO` i zwraca ją z kodem statusu `201 Created`.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu będzie ograniczony tylko do uwierzytelnionych użytkowników. Identyfikator użytkownika (`user_id`) zostanie pobrany z obiektu sesji (`Astro.locals.user`), a nie z ciała żądania.
- **Walidacja danych**: Ciało żądania będzie walidowane za pomocą schemy `zod` w celu ochrony przed nieprawidłowymi danymi.
- **Ochrona przed SQL Injection**: Wykorzystanie metod klienta Supabase zapewni odpowiednią parametryzację zapytań do bazy danych.

## 6. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy ciało żądania jest niekompletne, nieprawidłowe lub `schedule` nie jest w poprawnym formacie CRON.
- **`401 Unauthorized`**: Zwracany, gdy użytkownik nie jest zalogowany.
- **`403 Forbidden`**: Zwracany przez bazę danych i obsłużony w API, gdy użytkownik osiągnął limit 5 zaplanowanych przeglądów prasy.
- **`500 Internal Server Error`**: Zwracany w przypadku problemów z połączeniem z bazą danych lub innych nieoczekiwanych błędów po stronie serwera. Błędy będą logowane na konsoli.

## 7. Rozważania dotyczące wydajności

- Walidacja limitu przeglądów prasy zostanie przeniesiona do triggera w bazie danych. To podejście jest wydajniejsze i bezpieczniejsze niż wykonywanie dodatkowego zapytania `SELECT COUNT(*)` w kodzie aplikacji, ponieważ unika problemów z współbieżnością (race conditions) i zmniejsza liczbę zapytań do bazy.

## 8. Etapy wdrożenia

1.  **Migracja Bazy Danych**:
    - Stworzyć funkcję i trigger w PostgreSQL, które przed operacją `INSERT` lub `UPDATE` sprawdzają liczbę zaplanowanych przeglądów dla danego `user_id` i rzucają wyjątek, jeśli limit jest przekroczony.
2.  **Aktualizacja Typów**:
    - Zweryfikować, czy typy `CreatePressReviewCmd` i `PressReviewDTO` w `src/types.ts` są zgodne ze schematem bazy danych.
3.  **Implementacja Serwisu**:
    - Utworzyć nowy plik serwisu: `src/lib/services/pressReviewService.ts`.
    - Zaimplementować w nim metodę `createPressReview(cmd, userId)`, która będzie odpowiedzialna za dodanie nowego rekordu do bazy danych.
4.  **Implementacja Endpointu API**:
    - Utworzyć nowy plik endpointu: `src/pages/api/press-reviews.ts`.
    - Wewnątrz pliku zaimplementować handler dla metody `POST`.
    - Dodać logikę pobierania użytkownika z `Astro.locals`, walidacji ciała żądania oraz wywołania `pressReviewService`.
    - Zaimplementować obsługę błędów i zwracanie odpowiednich kodów statusu HTTP.
5.  **Testowanie**:
    - (Opcjonalnie) Dodać testy integracyjne dla nowego punktu końcowego, obejmujące scenariusze pomyślne oraz przypadki błędów (walidacja, autoryzacja, limit przeglądów).

### To-dos

- [ ] Ensure `CreatePressReviewCmd` and `PressReviewDTO` types in `src/types.ts` are up-to-date.
- [ ] Create `src/lib/services/pressReviewService.ts` with a `createPressReview` method.
- [ ] Create the API endpoint `src/pages/api/press-reviews.ts` with validation and error handling.
