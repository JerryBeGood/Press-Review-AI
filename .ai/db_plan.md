# Press Review AI – PostgreSQL Schema (MVP)

## 1. Tables, columns, and constraints

### 1.0 `users` (built-in table `auth.users` Supabase)

- **id**: `uuid`, primary key (PK)
- **email**: `text`, unique user email address
- **email_confirmed_at**: `timestamptz`, date of address confirmation
- **encrypted_password**: `text`, password hash stored by Supabase
- **created_at**: `timestamptz`, default `now()`
- **updated_at**: `timestamptz`, default `now()`

This table is managed by the Supabase authentication mechanism; the application schema references it via the foreign key `user_id`.

---

### 1.1 `press_reviews`

- **id**: `uuid`, primary key (PK), default `gen_random_uuid()`
- **user_id**: `uuid`, foreign key (FK) → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **topic**: `text`, `NOT NULL`
- **schedule**: `text`, schedule in CRON format, `NOT NULL`
- **created_at**: `timestamptz`, `NOT NULL`, default `now()`
- **updated_at**: `timestamptz`, `NOT NULL`, default `now()`

---

### 1.2 `generated_press_reviews`

- **id**: `uuid`, PK, default `gen_random_uuid()`
- **press_review_id**: `uuid`, FK → `press_reviews(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **user_id**: `uuid`, FK → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL` _(redundant for RLS simplification)_
- **generated_at**: `timestamptz`, `NULLABLE`; set to the time of generation completion.
- **status**: `press_review_status`, `NOT NULL`, default `pending`
- **generation_log_id**: `uuid`, FK → `generation_logs(id)`, `ON DELETE CASCADE`, `NULLABLE` (available after generation is complete)
- **content**: `jsonb`, generated content, `NULLABLE` (filled in after success)

---

### 1.3 `generation_logs`

- **id**: `uuid`, PK, default `gen_random_uuid()`
- **generated_press_review_id**: `uuid`, FK → `generated_press_reviews(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **user_id**: `uuid`, FK → `auth.users(id)`, `ON DELETE CASCADE`, `NOT NULL`
- **log_data**: `jsonb`, detailed logs from the generation process, `NOT NULL`
- **created_at**: `timestamptz`, `NOT NULL`, default `now()`

Each generated press release has exactly one associated log record (1-to-1 relationship).

---

### 1.4 User-defined types

- **press_review_status** – enum accepting values: `pending`, `success`, `failed`.

---

## 2. Relationships between tables

```
users (auth.users)
  └──< press_reviews
          └── < generated_press_reviews
                  └─── generation_logs (1-to-1)
```

- `users` 1-to-∞ `press_reviews`
- `press_reviews` 1-to-∞ `generated_press_reviews`
- `generated_press_reviews` 1-to-1 `generation_logs`

## 3. Indexes

- `press_reviews`: `(user_id, created_at DESC)`
- `generated_press_reviews`: `(press_review_id, generated_at DESC)`, `(status)`
- `generation_logs`: `(generated_press_review_id)`

## 4. RLS (Row-Level Security) rules

- Active for all tables related to `user_id`.
- Rule: `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations allowed only if `user_id` in the row is equal to `auth.uid()`.

## 5. Additional design notes

1. `pgcrypto` extension required for the `gen_random_uuid()` function (enabled by default in Supabase).
2. `updated_at` columns updated by a simple trigger setting the value to `now()` on each `UPDATE`.
3. The `ON DELETE CASCADE` mechanism guarantees that related data is deleted when a user or press release is deleted.

## 6. Triggers

### 6.1 `prevent_duplicate_topic_on_press_reviews`

- **Table**: `press_reviews`
- **Event**: `BEFORE INSERT OR UPDATE`
- **Function**: `prevent_duplicate_press_review_topic()`
- **Description**: Prevents the creation of duplicate press review topics for the same user (case-insensitive comparison). Throws an exception in case of a conflict.

### 6.2 `update_updated_at_trigger`

- **Tables**: `press_reviews`, `generated_press_reviews`
- **Event**: `BEFORE UPDATE`
- **Function**: `update_updated_at_column()`
- **Description**: Automatically updates the `updated_at` column to the current time (`now()`) on every `UPDATE` operation.

### 6.3 `limit_press_reviews_per_user`

- **Table**: `press_reviews`
- **Event**: `BEFORE INSERT`
- **Function**: `check_press_review_limit()`
- **Description**: Verifies that the user does not have more than five scheduled press reviews. If the limit is exceeded, it throws an exception.
