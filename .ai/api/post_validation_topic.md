# API Endpoint Implementation Plan: POST /press_reviews/validate_topic

## 1. Przegląd punktu końcowego

Endpoint weryfikuje temat prasówki (press review) z wykorzystaniem agenta AI. Zwraca informację, czy temat jest poprawny oraz – jeśli nie – propozycje alternatywnych tematów.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **URL**: `/api/press_reviews/validate_topic`  
  (ścieżka pliku: `src/pages/api/press_reviews/validate_topic.ts`)
- **Nagłówki**: tylko `Content-Type: application/json` (w trybie development brak uwierzytelniania)
- **Body**:
  ```json
  {
    "topic": "string"
  }
  ```
- **Parametry wymagane**: `topic` – string (trim, min 3, max 120 znaków)

## 3. Wykorzystywane typy

- `ValidateTopicCmd` – request body (`src/types.ts`, l. 41-43)
  ```ts
  interface ValidateTopicCmd {
    topic: string;
  }
  ```
- `ValidateTopicResultDTO` – response (`src/types.ts`, l. 45-48)
  ```ts
  interface ValidateTopicResultDTO {
    is_valid: boolean;
    suggestions: string[];
  }
  ```

## 4. Szczegóły odpowiedzi

Potencjalne odpowiedzi w fazie developmentu:

- **200 OK** – zawsze zwracane z ciałem:
  ```json
  {
    "is_valid": true,
    "suggestions": []
  }
  ```
- **400 Bad Request** – gdy `topic` jest brak lub pusty; przykład:
  ```json
  { "error": "Topic is required" }
  ```

> Kody 401 i 503 nie są obsługiwane na tym etapie (brak auth, brak integracji z AI).

## 5. Przepływ danych

1. Klient wysyła żądanie `POST` z polem `topic`.
2. Route `validate_topic.ts`:
   1. Parsuje body do `ValidateTopicCmd`.
   2. Waliduje Zod-schematem (`topic` min 3 znaki, trimmed).
   3. Ustawia `const userId = DEFAULT_USER_ID` (patrz `src/db/supabase.client.ts`).
   4. Wywołuje `pressReviewService.validateTopic(topic, userId)`.
3. Service `pressReviewService.validateTopic()` – na razie zwraca statycznie `{ is_valid: true, suggestions: [] }`.
4. Route zwraca JSON 200.

## 6. Względy bezpieczeństwa

- **Brak autoryzacji**: w fazie dev endpoint używa stałego `DEFAULT_USER_ID`.  
  W produkcji należy dodać JWT Supabase i 401.
- **Walidacja wejścia**: Zod (trim, min/max).
- **Rate limiting**: opcjonalnie w przyszłości.

## 7. Obsługa błędów

- **Brak lub pusty `topic`** → 400 Bad Request z komunikatem walidacji.
- **Inne nieprzewidziane wyjątki** → 500 Internal Server Error (log stacktrace).

## 8. Etapy wdrożenia

1. **Zod schema** – `validateTopicSchema`.
2. **Service layer** – `pressReviewService.validateTopic` zwracający stały wynik.
3. **API route** – bez auth; użyj `DEFAULT_USER_ID`.
