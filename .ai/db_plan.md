# Press Review AI – PostgreSQL Schema (MVP)

## 1. Tabele, kolumny i ograniczenia

### 1.0 `users` (wbudowana tabela `auth.users` Supabase)

- **id**: `uuid`, klucz główny (PK)
- **email**: `text`, unikalny adres e-mail użytkownika
- **email_confirmed_at**: `timestamptz`, data potwierdzenia adresu
- **encrypted_password**: `text`, hash hasła przechowywany przez Supabase
- **created_at**: `timestamptz`, domyślnie `now()`
- **updated_at**: `timestamptz`, domyślnie `now()`

Ta tabela jest zarządzana przez mechanizm autentykacji Supabase; schemat aplikacji odnosi się do niej poprzez klucz obcy `user_id`.

---

### 1.1 `press_reviews`

- **id**: `uuid`, klucz główny (PK), domyślnie `gen_random_uuid()`
- **user_id**: `uuid`, klucz obcy (FK) → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **topic**: `text`, `NOT NULL`
- **schedule**: `text`, harmonogram w formacie CRON, `NOT NULL`
- **created_at**: `timestamptz`, `NOT NULL`, domyślnie `now()`
- **updated_at**: `timestamptz`, `NOT NULL`, domyślnie `now()`

---

### 1.2 `generated_press_reviews`

- **id**: `uuid`, PK, domyślnie `gen_random_uuid()`
- **press_review_id**: `uuid`, FK → `press_reviews(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **user_id**: `uuid`, FK → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL` _(redundantnie dla uproszczenia RLS)_
- **generated_at**: `timestamptz`, `NULLABLE`; ustawiane na czas ukończenia generacji.
- **status**: `press_review_status`, `NOT NULL`, domyślnie `pending`
- **generation_log_id**: `uuid`, FK → `generation_logs(id)`, `ON DELETE CASCADE`, `NULLABLE` (dostępne po zakończeniu generacji)
- **content**: `jsonb`, wygenerowana treść, `NULLABLE` (uzupełniane po sukcesie)

---

### 1.3 `generation_logs`

- **id**: `uuid`, PK, domyślnie `gen_random_uuid()`
- **generated_press_review_id**: `uuid`, FK → `generated_press_reviews(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **user_id**: `uuid`, FK → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **log_data**: `jsonb`, szczegółowe logi z procesu generacji, `NOT NULL`
- **created_at**: `timestamptz`, `NOT NULL`, domyślnie `now()`

Każda wygenerowana prasówka posiada dokładnie jeden powiązany rekord z logami (relacja 1-do-1).

---

### 1.4 Typy zdefiniowane przez użytkownika

- **press_review_status** – enum przyjmujący wartości: `pending`, `success`, `failed`.

---

## 2. Relacje między tabelami

```
users (auth.users)
  └──< press_reviews
          └──< generated_press_reviews
                  └─── generation_logs (1-do-1)
```

- `users` 1-do-∞ `press_reviews`
- `press_reviews` 1-do-∞ `generated_press_reviews`
- `generated_press_reviews` 1-do-1 `generation_logs`

## 3. Indeksy

- `press_reviews`: `(user_id, created_at DESC)`
- `generated_press_reviews`: `(press_review_id, generated_at DESC)`, `(status)`
- `generation_logs`: `(generated_press_review_id)`

## 4. Zasady RLS (Row-Level Security)

- Aktywne dla wszystkich tabel powiązanych z `user_id`.
- Reguła: operacje `SELECT`, `INSERT`, `UPDATE`, `DELETE` dozwolone tylko wtedy, gdy `user_id` w wierszu jest równe `auth.uid()`.

## 5. Dodatkowe uwagi projektowe

1. Wymagane rozszerzenie `pgcrypto` dla funkcji `gen_random_uuid()` (domyślnie włączone w Supabase).
2. Kolumny `updated_at` aktualizowane przez prosty trigger ustawiający wartość na `now()` przy każdym `UPDATE`.
3. Mechanizm `ON DELETE CASCADE` gwarantuje usunięcie powiązanych danych po skasowaniu użytkownika lub prasówki.

## 6. Triggery

### 6.1 `prevent_duplicate_topic_on_press_reviews`

- **Tabela**: `press_reviews`
- **Zdarzenie**: `BEFORE INSERT OR UPDATE`
- **Funkcja**: `prevent_duplicate_press_review_topic()`
- **Opis**: Zapobiega tworzeniu duplikatów tematów prasówek dla tego samego użytkownika (porównanie bez uwzględniania wielkości liter). W przypadku konfliktu rzuca wyjątek.

### 6.2 `update_updated_at_trigger`

- **Tabele**: `press_reviews`, `generated_press_reviews`
- **Zdarzenie**: `BEFORE UPDATE`
- **Funkcja**: `update_updated_at_column()`
- **Opis**: Automatycznie aktualizuje kolumnę `updated_at` na aktualny czas (`now()`) przy każdej operacji `UPDATE`.

### 6.3 `limit_press_reviews_per_user`

- **Tabela**: `press_reviews`
- **Zdarzenie**: `BEFORE INSERT`
- **Funkcja**: `check_press_review_limit()`
- **Opis**: Weryfikuje, że użytkownik nie posiada więcej niż pięciu zaplanowanych prasówek. W przypadku przekroczenia limitu rzuca wyjątek.
