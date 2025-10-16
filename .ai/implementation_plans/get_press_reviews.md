# API Endpoint Implementation Plan: GET /press_reviews

## 1. Przegląd punktu końcowego

Endpoint zwraca wszystkie przeglądy prasowe (`press_reviews`) należące do zalogowanego użytkownika. Każdy użytkownik może mieć maksymalnie 5 przeglądów prasowych, więc nie ma potrzeby implementacji paginacji ani sortowania. W trybie deweloperskim używamy stałego `DEFAULT_USER_ID` zamiast rzeczywistej autentykacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/press_reviews`
- **Parametry**:
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body**: brak (metoda GET)
- **Headers**: W produkcji wymagany token autentykacji, w dev używamy DEFAULT_USER_ID

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

```typescript
// Response type - już zdefiniowany
export interface PressReviewsListDTO {
  data: PressReviewDTO[];
  count: number;
}

// Single press review - już zdefiniowany
export type PressReviewDTO = Omit<Tables<"press_reviews">, "user_id">;
```

Struktura `PressReviewDTO` zawiera:

- `id`: uuid
- `topic`: string
- `schedule`: string (format CRON)
- `created_at`: timestamptz
- `updated_at`: timestamptz

## 4. Szczegóły odpowiedzi

**Sukces (200 OK)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "topic": "string",
      "schedule": "string (cron format)",
      "created_at": "timestamptz",
      "updated_at": "timestamptz"
    }
  ],
  "count": 5
}
```

**Błąd (401 Unauthorized)**:

```json
{
  "error": "Unauthorized"
}
```

**Błąd (500 Internal Server Error)**:

```json
{
  "error": "Internal server error"
}
```

## 5. Przepływ danych

1. **Request** → Endpoint `/api/press_reviews`
2. **Handler** → Pobiera user_id (w dev: DEFAULT_USER_ID, w prod: z context.locals.supabase)
3. **Service** → `pressReviewService.getPressReviews(userId)`
4. **Database** → Query do Supabase: `SELECT * FROM press_reviews WHERE user_id = $1`
5. **Transform** → Mapowanie wyników do `PressReviewDTO` (usunięcie user_id)
6. **Response** → Zwrócenie `PressReviewsListDTO` z danymi i count

### Interakcje z bazą danych:

- Tabela: `press_reviews`
- Operacja: SELECT
- Filtrowanie: `user_id = DEFAULT_USER_ID`
- Brak paginacji (max 5 rekordów)

## 6. Względy bezpieczeństwa

### Autentykacja (Development):

- Używamy `DEFAULT_USER_ID` z `src/db/supabase.client.ts`
- Wartość: `"8515916a-ca4d-415a-8e9a-36258ff59436"`

### Autentykacja (Production - przyszłość):

- Sprawdzenie czy użytkownik jest zalogowany
- Pobranie user_id z sesji/tokenu
- Zwrócenie 401 jeśli brak autentykacji

### Autoryzacja:

- Użytkownik widzi tylko swoje press_reviews
- Filtrowanie po user_id zapobiega dostępowi do cudzych danych
- Używamy supabase z `context.locals`, nie bezpośredniego importu

### Walidacja:

- Brak parametrów wejściowych do walidacji
- Walidacja user_id jako UUID (już walidowane przez Supabase)

## 7. Obsługa błędów

| Scenariusz           | Kod statusu | Komunikat               | Działanie                                |
| -------------------- | ----------- | ----------------------- | ---------------------------------------- |
| Brak autentykacji    | 401         | "Unauthorized"          | Zwróć błąd (tylko w prod)                |
| Błąd połączenia z DB | 500         | "Internal server error" | Loguj błąd, zwróć ogólny komunikat       |
| Błąd Supabase        | 500         | "Internal server error" | Loguj szczegóły, zwróć ogólny komunikat  |
| Brak wyników         | 200         | `{data: [], count: 0}`  | Zwróć pustą listę (prawidłowy przypadek) |
| Sukces               | 200         | Pełna lista             | Zwróć dane                               |

### Implementacja error handling:

```typescript
try {
  // Query logic
} catch (error) {
  console.error("[GET /press_reviews] Error:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 9. Etapy wdrożenia

### Krok 1: Utworzenie/aktualizacja serwisu

**Plik**: `src/lib/services/pressReviewService.ts`

Dodaj metodę:

```typescript
export async function getPressReviews(supabase: SupabaseClient, userId: string): Promise<PressReviewsListDTO> {
  const { data, error, count } = await supabase
    .from("press_reviews")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  // Remove user_id from results to match PressReviewDTO
  const pressReviews: PressReviewDTO[] = data.map(({ user_id, ...rest }) => rest);

  return {
    data: pressReviews,
    count: count || 0,
  };
}
```

### Krok 2: Utworzenie endpointu API

**Plik**: `src/pages/api/press_reviews.ts`

```typescript
import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { getPressReviews } from "@/lib/services/pressReviewService";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // In development, use DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    const result = await getPressReviews(supabase, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[GET /press_reviews] Error:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
```

### Krok 3: Weryfikacja middleware

**Plik**: `src/middleware/index.ts`

Upewnij się, że middleware poprawnie inicjalizuje `locals.supabase`:

```typescript
// Powinno już istnieć
context.locals.supabase = supabaseClient;
```
