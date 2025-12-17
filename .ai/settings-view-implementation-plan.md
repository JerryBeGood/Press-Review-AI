# Plan implementacji widoku Settings

## 1. Przegląd

Widok Settings (Ustawienia) umożliwia użytkownikowi zarządzanie swoim kontem, w tym:

- Zmianę hasła (z wymaganiem podania starego hasła)
- Zmianę adresu e-mail (z weryfikacją przez link aktywacyjny)
- Trwałe usunięcie konta wraz ze wszystkimi danymi

Widok jest zgodny z brutalistycznym stylem designu aplikacji i wykorzystuje Supabase Auth do operacji na koncie użytkownika. Wszystkie operacje wymagają aktywnej sesji użytkownika i odpowiedniej autoryzacji.

## 2. Routing widoku

**Ścieżka:** `/settings`

Widok dostępny jest wyłącznie dla zalogowanych użytkowników (wymaga autentykacji). Middleware aplikacji automatycznie przekieruje niezalogowanych użytkowników na `/login`.

Należy dodać link do widoku Settings w nawigacji w `BrutalistLayout.astro`, obok istniejących linków DASHBOARD i ARCHIVE.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku Settings:

```
SettingsView (główny komponent React)
├── ChangePasswordForm
│   ├── Form (shadcn/ui)
│   ├── FormField (shadcn/ui)
│   ├── Input (shadcn/ui)
│   ├── Button (shadcn/ui)
│   └── FormMessage (shadcn/ui)
├── ChangeEmailForm
│   ├── Form (shadcn/ui)
│   ├── FormField (shadcn/ui)
│   ├── Input (shadcn/ui)
│   ├── Button (shadcn/ui)
│   └── FormMessage (shadcn/ui)
└── DeleteAccountSection
    ├── Button (shadcn/ui)
    └── AlertDialog (shadcn/ui)
        ├── AlertDialogTrigger
        ├── AlertDialogContent
        │   ├── AlertDialogHeader
        │   │   ├── AlertDialogTitle
        │   │   └── AlertDialogDescription
        │   ├── Input (dla potwierdzenia hasłem)
        │   └── AlertDialogFooter
        │       ├── AlertDialogCancel
        │       └── AlertDialogAction
```

## 4. Szczegóły komponentów

### SettingsView

**Opis:** Główny komponent widoku Settings, który łączy wszystkie sekcje (zmiana hasła, zmiana e-maila, usunięcie konta) w jednolity interfejs.

**Główne elementy:**

- Nagłówek strony z tytułem "ACCOUNT SETTINGS"
- Kontener z trzema sekcjami oddzielonymi wizualnie
- Sekcja "Change Password" z komponentem `ChangePasswordForm`
- Sekcja "Change Email" z komponentem `ChangeEmailForm`
- Sekcja "Danger Zone" z komponentem `DeleteAccountSection` (czerwone tło jako ostrzeżenie)

**Obsługiwane interakcje:**

- Przekazywanie propsów do komponentów potomnych
- Synchronizacja powiadomień toast dla wszystkich operacji

**Warunki walidacji:**

- Komponent nie waliduje bezpośrednio - deleguje to do komponentów potomnych

**Typy:**

- Brak dodatkowych typów - komponenty potomne definiują własne typy

**Propsy:**

```typescript
interface SettingsViewProps {
  userEmail: string; // Aktualny adres e-mail użytkownika
}
```

### ChangePasswordForm

**Opis:** Formularz umożliwiający zmianę hasła użytkownika. Wymaga podania obecnego hasła (dla bezpieczeństwa) oraz nowego hasła z potwierdzeniem.

**Główne elementy:**

- Nagłówek sekcji "Change Password"
- Formularz z trzema polami:
  - `currentPassword` - pole typu password dla obecnego hasła
  - `newPassword` - pole typu password dla nowego hasła
  - `confirmPassword` - pole typu password dla potwierdzenia nowego hasła
- Przycisk submit "UPDATE PASSWORD"
- Komunikaty walidacyjne pod każdym polem
- Toast z informacją o sukcesie lub błędzie

**Obsługiwane interakcje:**

- `onSubmit`: Walidacja formularza i wywołanie API `/api/auth/change-password`
- Real-time walidacja pól (przy onBlur)
- Wyświetlanie komunikatów błędów walidacji
- Wyświetlanie toast po zakończeniu operacji

**Warunki walidacji:**

- `currentPassword`:
  - Wymagane (min 1 znak)
  - Komunikat błędu: "Current password is required"
- `newPassword`:
  - Minimum 8 znaków
  - Przynajmniej jedna wielka litera
  - Przynajmniej jedna cyfra
  - Przynajmniej jeden znak specjalny
  - Komunikaty błędów zgodne z `passwordSchema` w `auth.schemas.ts`
- `confirmPassword`:
  - Musi być identyczne z `newPassword`
  - Komunikat błędu: "Passwords do not match"
- Dodatkowa walidacja: `newPassword` nie może być identyczne z `currentPassword`

**Typy:**

- `ChangePasswordInput` - typ dla danych formularza (zdefiniowany w schemas)
- `changePasswordSchema` - schemat zod dla walidacji

**Propsy:**
Komponent nie przyjmuje propsów (standalone).

### ChangeEmailForm

**Opis:** Formularz umożliwiający zmianę adresu e-mail. Po przesłaniu formularza, na nowy adres e-mail wysyłany jest link weryfikacyjny. Stary adres pozostaje aktywny do momentu weryfikacji nowego.

**Główne elementy:**

- Nagłówek sekcji "Change Email"
- Wyświetlenie aktualnego adresu e-mail (disabled input lub tekst)
- Formularz z jednym polem:
  - `newEmail` - pole typu email dla nowego adresu
- Przycisk submit "SEND VERIFICATION EMAIL"
- Komunikat walidacyjny pod polem
- Toast z informacją o sukcesie lub błędzie
- Informacja tekstowa o konieczności weryfikacji

**Obsługiwane interakcje:**

- `onSubmit`: Walidacja formularza i wywołanie API `/api/auth/change-email`
- Real-time walidacja formatu e-mail (przy onBlur)
- Wyświetlanie komunikatu o wysłaniu e-maila weryfikacyjnego
- Wyświetlanie toast po zakończeniu operacji

**Warunki walidacji:**

- `newEmail`:
  - Poprawny format adresu e-mail
  - Komunikat błędu: "Must be a valid email address"
  - Nie może być identyczny z obecnym e-mailem
  - Komunikat błędu: "New email must be different from current email"

**Typy:**

- `ChangeEmailInput` - typ dla danych formularza
- `changeEmailSchema` - schemat zod dla walidacji

**Propsy:**

```typescript
interface ChangeEmailFormProps {
  currentEmail: string; // Aktualny adres e-mail do wyświetlenia
}
```

### DeleteAccountSection

**Opis:** Sekcja z możliwością trwałego usunięcia konta użytkownika. Ze względu na krytyczność operacji, wymaga potwierdzenia przez wprowadzenie hasła w modal dialogu. Po usunięciu konta, użytkownik jest wylogowywany i przekierowywany na stronę logowania.

**Główne elementy:**

- Nagłówek sekcji "Danger Zone" z czerwonym tłem ostrzegawczym
- Tekst ostrzegawczy o nieodwracalności operacji
- Przycisk "DELETE ACCOUNT" w czerwonym kolorze
- AlertDialog (modal) z:
  - Nagłówkiem "Delete Account"
  - Opisem ostrzegawczym o konsekwencjach
  - Polem typu password dla potwierdzenia hasłem
  - Przyciskami "Cancel" i "Delete Account"

**Obsługiwane interakcje:**

- `onClick` na przycisku DELETE ACCOUNT: Otwiera modal AlertDialog
- `onChange` w polu password: Aktualizuje stan hasła
- `onConfirm`: Walidacja hasła i wywołanie API `/api/auth/delete-account`
- `onCancel`: Zamyka modal i resetuje pole hasła
- Po sukcesie: Wylogowanie użytkownika i redirect na `/login`

**Warunki walidacji:**

- Pole password w modalu:
  - Wymagane (min 1 znak)
  - Komunikat błędu: "Password is required to delete account"
- Backend weryfikuje poprawność hasła przed usunięciem konta

**Typy:**

- `DeleteAccountInput` - typ dla danych z modalu
- `deleteAccountSchema` - schemat zod dla walidacji hasła

**Propsy:**
Komponent nie przyjmuje propsów (standalone).

## 5. Typy

### Nowe typy dla widoku Settings

```typescript
// src/lib/schemas/auth.schemas.ts (rozszerzenie istniejącego pliku)

/**
 * Schema walidacji dla zmiany hasła
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Schema walidacji dla zmiany e-maila
 */
export const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Must be a valid email address" }),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

/**
 * Schema walidacji dla API zmiany e-maila (wymaga currentEmail do porównania)
 */
export const changeEmailApiSchema = z
  .object({
    currentEmail: z.string().email(),
    newEmail: z.string().email({ message: "Must be a valid email address" }),
  })
  .refine((data) => data.newEmail !== data.currentEmail, {
    message: "New email must be different from current email",
    path: ["newEmail"],
  });

export type ChangeEmailApiInput = z.infer<typeof changeEmailApiSchema>;

/**
 * Schema walidacji dla usunięcia konta
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Password is required to delete account" }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
```

### DTO dla odpowiedzi API

```typescript
// src/types/api.ts (rozszerzenie istniejącego pliku)

/**
 * Response dla POST /api/auth/change-password
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Response dla POST /api/auth/change-email
 */
export interface ChangeEmailResponse {
  message: string;
}

/**
 * Response dla POST /api/auth/delete-account
 */
export interface DeleteAccountResponse {
  message: string;
}

/**
 * Wspólny typ dla błędów API
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  errors?: Record<string, string[]>; // Dla błędów walidacji
}
```

## 6. Zarządzanie stanem

### Stan w komponentach

Każdy formularz (ChangePasswordForm, ChangeEmailForm, DeleteAccountSection) zarządza własnym stanem lokalnie przy użyciu:

1. **React Hook Form** - dla zarządzania stanem formularza:
   - Wartości pól
   - Błędy walidacji
   - Stan submit (isSubmitting)
   - Metody kontroli formularza

2. **Local State (useState)** - dla dodatkowego stanu UI:
   - `isSubmitting: boolean` - czy formularz jest w trakcie wysyłania
   - `error: string | null` - globalny błąd formularza (poza walidacją pól)
   - `success: boolean` - czy operacja zakończyła się sukcesem

3. **DeleteAccountSection** - dodatkowy stan:
   - `isDialogOpen: boolean` - czy modal jest otwarty
   - `password: string` - wartość pola hasła w modalu

### Nie jest wymagany custom hook

Ze względu na prostotę operacji i brak potrzeby współdzielenia stanu między komponentami, nie jest wymagany dedykowany custom hook. Każdy komponent jest samodzielny i zarządza własnym stanem.

Jeśli w przyszłości pojawi się potrzeba współdzielenia logiki (np. re-authentication), można rozważyć stworzenie hooka `useUserSettings`.

## 7. Integracja API

### Nowe endpointy API

#### POST /api/auth/change-password

**Ścieżka:** `src/pages/api/auth/change-password.ts`

**Request Body:**

```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Typ żądania:** `Omit<ChangePasswordInput, 'confirmPassword'>`

**Typ odpowiedzi:** `ChangePasswordResponse`

**Odpowiedzi:**

- `200 OK`: Hasło zmienione pomyślnie
  ```json
  {
    "message": "Password updated successfully"
  }
  ```
- `400 Bad Request`: Błędne dane wejściowe (walidacja)
  ```json
  {
    "code": "VALIDATION_ERROR",
    "errors": { "currentPassword": ["..."], "newPassword": ["..."] }
  }
  ```
- `401 Unauthorized`: Niepoprawne obecne hasło
  ```json
  {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
  ```
- `500 Internal Server Error`: Błąd serwera

**Implementacja:**

```typescript
// Weryfikacja sesji przez middleware
// Walidacja danych wejściowych za pomocą zod
// Wywołanie Supabase: await supabase.auth.updateUser({ password: newPassword })
// Zwrócenie odpowiedzi
```

#### POST /api/auth/change-email

**Ścieżka:** `src/pages/api/auth/change-email.ts`

**Request Body:**

```typescript
{
  newEmail: string;
}
```

**Typ żądania:** `ChangeEmailInput`

**Typ odpowiedzi:** `ChangeEmailResponse`

**Odpowiedzi:**

- `200 OK`: E-mail weryfikacyjny wysłany
  ```json
  {
    "message": "Verification email sent to new address. Please check your inbox."
  }
  ```
- `400 Bad Request`: Błędne dane wejściowe (walidacja)
- `409 Conflict`: E-mail już używany przez innego użytkownika
- `500 Internal Server Error`: Błąd serwera

**Implementacja:**

```typescript
// Weryfikacja sesji przez middleware
// Pobranie currentEmail z locals.user.email
// Walidacja newEmail !== currentEmail
// Wywołanie Supabase: await supabase.auth.updateUser({
//   email: newEmail,
//   options: { emailRedirectTo: `${origin}/api/auth/callback?type=email_change` }
// })
// Zwrócenie odpowiedzi
```

#### POST /api/auth/delete-account

**Ścieżka:** `src/pages/api/auth/delete-account.ts`

**Request Body:**

```typescript
{
  password: string;
}
```

**Typ żądania:** `DeleteAccountInput`

**Typ odpowiedzi:** `DeleteAccountResponse`

**Odpowiedzi:**

- `200 OK`: Konto usunięte pomyślnie
  ```json
  {
    "message": "Account deleted successfully"
  }
  ```
- `400 Bad Request`: Błędne dane wejściowe
- `401 Unauthorized`: Niepoprawne hasło
- `500 Internal Server Error`: Błąd serwera

**Implementacja:**

```typescript
// Weryfikacja sesji przez middleware
// Walidacja hasła przez re-authentication:
//   await supabase.auth.signInWithPassword({ email: user.email, password })
// Usunięcie konta przez Supabase Admin API:
//   await supabaseAdmin.auth.admin.deleteUser(user.id)
// Wylogowanie użytkownika: await supabase.auth.signOut()
// Zwrócenie odpowiedzi
```

**Uwaga:** Usunięcie konta powinno automatycznie usunąć wszystkie powiązane dane dzięki kaskadowym regułom `ON DELETE CASCADE` w bazie danych (press_reviews, generated_press_reviews itp.).

### Obsługa callback dla zmiany e-maila

Należy zaktualizować istniejący endpoint `src/pages/api/auth/callback.ts`, dodając obsługę typu `email_change`:

```typescript
if (type === "email_change") {
  await locals.supabase.auth.exchangeCodeForSession(authCode);
  // Sign out user to force re-login with new email
  await locals.supabase.auth.signOut();
  cookies.set("show-email-change-success", "true", {
    path: "/",
    maxAge: 60,
  });
  return redirect("/login");
}
```

## 8. Interakcje użytkownika

### Zmiana hasła (ChangePasswordForm)

1. **Wypełnianie formularza:**
   - Użytkownik wpisuje obecne hasło w pole "Current Password"
   - Użytkownik wpisuje nowe hasło w pole "New Password"
   - Użytkownik potwierdza nowe hasło w pole "Confirm Password"
   - Walidacja pól odbywa się na bieżąco (onBlur) i wyświetla komunikaty błędów pod polami

2. **Przesyłanie formularza:**
   - Użytkownik klika przycisk "UPDATE PASSWORD"
   - Przycisk zmienia stan na "UPDATING PASSWORD..." i jest disabled
   - Formularz wywołuje POST `/api/auth/change-password`
3. **Scenariusze odpowiedzi:**
   - **Sukces (200):**
     - Wyświetlenie toast sukcesu: "Password updated successfully"
     - Wyczyszczenie formularza
     - Przywrócenie stanu przycisku
   - **Błąd niepoprawnego obecnego hasła (401):**
     - Wyświetlenie toast błędu: "Current password is incorrect"
     - Focus na pole "Current Password"
     - Przywrócenie stanu przycisku
   - **Błąd walidacji (400):**
     - Wyświetlenie błędów pod odpowiednimi polami
     - Przywrócenie stanu przycisku
   - **Błąd serwera (500):**
     - Wyświetlenie toast błędu: "An unexpected error occurred. Please try again."
     - Przywrócenie stanu przycisku

### Zmiana e-maila (ChangeEmailForm)

1. **Wypełnianie formularza:**
   - Użytkownik widzi swój aktualny e-mail (wyświetlony jako disabled input lub tekst)
   - Użytkownik wpisuje nowy adres e-mail w pole "New Email"
   - Walidacja formatu e-mail odbywa się na bieżąco

2. **Przesyłanie formularza:**
   - Użytkownik klika przycisk "SEND VERIFICATION EMAIL"
   - Przycisk zmienia stan na "SENDING..." i jest disabled
   - Formularz wywołuje POST `/api/auth/change-email`

3. **Scenariusze odpowiedzi:**
   - **Sukces (200):**
     - Wyświetlenie toast sukcesu: "Verification email sent. Please check your inbox."
     - Wyświetlenie dodatkowego komunikatu pod formularzem: "Your current email will remain active until you verify the new one."
     - Wyczyszczenie pola "New Email"
     - Przywrócenie stanu przycisku
   - **Błąd identycznego e-maila:**
     - Wyświetlenie błędu pod polem: "New email must be different from current email"
   - **Błąd konfliktu (409):**
     - Wyświetlenie toast błędu: "This email is already in use"
   - **Błąd serwera (500):**
     - Wyświetlenie toast błędu: "An unexpected error occurred. Please try again."

4. **Weryfikacja nowego e-maila:**
   - Użytkownik otrzymuje e-mail z linkiem weryfikacyjnym na nowy adres
   - Kliknięcie linku przekierowuje na `/api/auth/callback?type=email_change&code=...`
   - Po weryfikacji użytkownik jest wylogowywany i przekierowywany na `/login` z komunikatem sukcesu: "Email updated successfully. Please sign in with your new email address."

### Usunięcie konta (DeleteAccountSection)

1. **Otwarcie modalu:**
   - Użytkownik widzi sekcję "Danger Zone" z czerwonym tłem i przyciskiem "DELETE ACCOUNT"
   - Użytkownik klika przycisk "DELETE ACCOUNT"
   - Otwiera się AlertDialog z ostrzeżeniem

2. **Potwierdzenie w modalu:**
   - Modal wyświetla:
     - Tytuł: "Delete Account"
     - Opis: "This action cannot be undone. All your press reviews and data will be permanently deleted."
     - Pole typu password z labelką "Enter your password to confirm"
     - Przyciski "Cancel" i "Delete Account" (czerwony)
   - Użytkownik wpisuje hasło w pole

3. **Anulowanie:**
   - Użytkownik klika "Cancel" lub kliknięcie poza modalem
   - Modal zamyka się
   - Pole hasła jest resetowane

4. **Przesyłanie żądania usunięcia:**
   - Użytkownik klika "Delete Account" w modalu
   - Przycisk zmienia stan na "DELETING..." i jest disabled
   - Formularz wywołuje POST `/api/auth/delete-account`

5. **Scenariusze odpowiedzi:**
   - **Sukces (200):**
     - Wyświetlenie toast sukcesu: "Account deleted successfully"
     - Automatyczne wylogowanie użytkownika
     - Przekierowanie na `/login`
   - **Błąd niepoprawnego hasła (401):**
     - Wyświetlenie toast błędu: "Incorrect password"
     - Focus na pole password w modalu
     - Przywrócenie stanu przycisku
   - **Błąd serwera (500):**
     - Wyświetlenie toast błędu: "Failed to delete account. Please try again."
     - Przywrócenie stanu przycisku
     - Modal pozostaje otwarty

## 9. Warunki i walidacja

### Walidacja na poziomie formularza (client-side)

#### ChangePasswordForm

| Pole            | Warunki                  | Komunikat błędu                                        | Moment walidacji |
| --------------- | ------------------------ | ------------------------------------------------------ | ---------------- |
| currentPassword | Niepuste                 | "Current password is required"                         | onBlur, onSubmit |
| newPassword     | Min. 8 znaków            | "Password must be at least 8 characters"               | onBlur, onSubmit |
| newPassword     | Min. 1 wielka litera     | "Password must contain at least one capital letter"    | onBlur, onSubmit |
| newPassword     | Min. 1 cyfra             | "Password must contain at least one number"            | onBlur, onSubmit |
| newPassword     | Min. 1 znak specjalny    | "Password must contain at least one special character" | onBlur, onSubmit |
| newPassword     | Różne od currentPassword | "New password must be different from current password" | onSubmit         |
| confirmPassword | Niepuste                 | "Please confirm your new password"                     | onBlur, onSubmit |
| confirmPassword | Identyczne z newPassword | "Passwords do not match"                               | onBlur, onSubmit |

**Stan UI na podstawie walidacji:**

- Jeśli pole ma błąd: wyświetlenie czerwonego komunikatu pod polem
- Jeśli formularz jest niepoprawny: przycisk submit jest disabled
- Podczas submitu: przycisk zmienia tekst i jest disabled

#### ChangeEmailForm

| Pole     | Warunki                | Komunikat błędu                                  | Moment walidacji |
| -------- | ---------------------- | ------------------------------------------------ | ---------------- |
| newEmail | Niepuste               | "Email is required"                              | onBlur, onSubmit |
| newEmail | Poprawny format e-mail | "Must be a valid email address"                  | onBlur, onSubmit |
| newEmail | Różne od currentEmail  | "New email must be different from current email" | onSubmit         |

**Stan UI na podstawie walidacji:**

- Jeśli pole ma błąd: wyświetlenie czerwonego komunikatu pod polem
- Jeśli formularz jest niepoprawny: przycisk submit jest disabled
- Po sukcesie: wyświetlenie informacji o wysłaniu e-maila

#### DeleteAccountSection

| Pole                | Warunki  | Komunikat błędu                          | Moment walidacji |
| ------------------- | -------- | ---------------------------------------- | ---------------- |
| password (w modalu) | Niepuste | "Password is required to delete account" | onSubmit         |

**Stan UI na podstawie walidacji:**

- Jeśli pole jest puste przy submit: wyświetlenie błędu pod polem w modalu
- Przycisk "Delete Account" w modalu jest zawsze enabled (walidacja po kliknięciu)

### Walidacja na poziomie API (server-side)

Wszystkie endpointy wykonują walidację:

1. **Weryfikacja sesji:**
   - Middleware sprawdza czy użytkownik jest zalogowany
   - Zwraca 401 Unauthorized jeśli brak sesji

2. **Walidacja schematu zod:**
   - Każdy endpoint waliduje request body za pomocą odpowiedniego schematu
   - Zwraca 400 Bad Request z szczegółami błędów walidacji

3. **Walidacja biznesowa:**
   - `/api/auth/change-password`: Sprawdza poprawność obecnego hasła przez re-authentication
   - `/api/auth/change-email`: Sprawdza czy nowy e-mail nie jest już używany (Supabase zwraca błąd)
   - `/api/auth/delete-account`: Sprawdza poprawność hasła przed usunięciem

4. **Obsługa błędów Supabase:**
   - Każdy endpoint obsługuje błędy zwracane przez Supabase Auth
   - Mapuje kody błędów Supabase na przyjazne komunikaty dla użytkownika

## 10. Obsługa błędów

### Typy błędów i ich obsługa

#### 1. Błędy walidacji (400 Bad Request)

**Źródło:** Niepoprawne dane wejściowe (nie przeszły przez schemat zod)

**Obsługa:**

- Wyświetlenie komunikatów błędów pod odpowiednimi polami formularza
- Użycie `FormMessage` z shadcn/ui do wyświetlenia błędów
- Przywrócenie stanu przycisku submit (isSubmitting = false)

**Przykład:**

```typescript
if (error.code === "VALIDATION_ERROR") {
  // Ustawienie błędów w react-hook-form
  Object.entries(error.errors).forEach(([field, messages]) => {
    form.setError(field as any, { message: messages[0] });
  });
}
```

#### 2. Błędy autoryzacji (401 Unauthorized)

**Źródło:**

- Niepoprawne obecne hasło w `ChangePasswordForm`
- Niepoprawne hasło w `DeleteAccountSection`
- Brak sesji użytkownika (obsługiwane przez middleware)

**Obsługa:**

- Wyświetlenie toast z komunikatem błędu
- Focus na odpowiednie pole (password)
- Przywrócenie stanu przycisku submit

**Przykład:**

```typescript
if (response.status === 401) {
  toast.error("Current password is incorrect");
  form.setFocus("currentPassword");
}
```

#### 3. Błędy konfliktu (409 Conflict)

**Źródło:**

- Próba zmiany e-maila na adres już używany przez innego użytkownika

**Obsługa:**

- Wyświetlenie toast z komunikatem: "This email is already in use"
- Przywrócenie stanu przycisku submit
- Możliwość ponownego wprowadzenia e-maila

#### 4. Błędy serwera (500 Internal Server Error)

**Źródło:**

- Problemy z Supabase
- Nieoczekiwane błędy w kodzie backendu
- Problemy z siecią

**Obsługa:**

- Wyświetlenie generycznego toast błędu: "An unexpected error occurred. Please try again."
- Logowanie błędu w konsoli (tylko w development)
- Przywrócenie stanu przycisku submit
- Możliwość ponownego submitu formularza

#### 5. Błędy sieciowe (Network Error)

**Źródło:**

- Brak połączenia z internetem
- Timeout połączenia
- Problemy CORS

**Obsługa:**

```typescript
try {
  const response = await fetch(endpoint, options);
  // ...
} catch (err) {
  if (err instanceof TypeError) {
    toast.error("Network error. Please check your connection.");
  } else {
    toast.error("An unexpected error occurred. Please try again.");
  }
  setIsSubmitting(false);
}
```

### Strategia obsługi błędów per komponent

#### ChangePasswordForm

```typescript
const handleSubmit = async (values: ChangePasswordInput) => {
  setIsSubmitting(true);
  setError(null);

  try {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json();

      if (response.status === 401) {
        toast.error("Current password is incorrect");
        form.setFocus("currentPassword");
        return;
      }

      if (response.status === 400 && data.errors) {
        // Obsługa błędów walidacji
        Object.entries(data.errors).forEach(([field, messages]) => {
          form.setError(field as any, { message: (messages as string[])[0] });
        });
        return;
      }

      throw new Error(data.message || "Failed to update password");
    }

    toast.success("Password updated successfully");
    form.reset();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
  } finally {
    setIsSubmitting(false);
  }
};
```

#### ChangeEmailForm

```typescript
// Podobna struktura jak ChangePasswordForm
// Dodatkowa obsługa błędu 409 (conflict)
```

#### DeleteAccountSection

```typescript
// Podobna struktura jak ChangePasswordForm
// Po sukcesie: automatyczne przekierowanie na /login
if (response.ok) {
  toast.success("Account deleted successfully");
  setTimeout(() => {
    window.location.href = "/login";
  }, 1000);
}
```

### Logowanie błędów

W środowisku development wszystkie błędy są logowane w konsoli:

```typescript
if (import.meta.env.DEV) {
  console.error("Error in ChangePasswordForm:", err);
}
```

W środowisku production błędy są logowane tylko na serwerze (w endpointach API).

## 11. Kroki implementacji

### Faza 1: Przygotowanie typów i schematów (1-2h)

1. **Rozszerzenie `src/lib/schemas/auth.schemas.ts`:**
   - Dodanie `changePasswordSchema` z walidacją trzech pól
   - Dodanie `changeEmailSchema` z walidacją e-maila
   - Dodanie `changeEmailApiSchema` z porównaniem e-maili
   - Dodanie `deleteAccountSchema` z walidacją hasła
   - Export typów dla każdego schematu

2. **Rozszerzenie `src/types/api.ts`:**
   - Dodanie interfejsów `ChangePasswordResponse`, `ChangeEmailResponse`, `DeleteAccountResponse`
   - Dodanie interfejsu `ApiErrorResponse` dla standaryzacji błędów

### Faza 2: Implementacja API endpoints (3-4h)

3. **Utworzenie `src/pages/api/auth/change-password.ts`:**
   - Implementacja POST handler
   - Walidacja request body za pomocą zod
   - Re-authentication dla weryfikacji obecnego hasła
   - Wywołanie `supabase.auth.updateUser({ password })`
   - Obsługa błędów i zwrócenie odpowiedzi

4. **Utworzenie `src/pages/api/auth/change-email.ts`:**
   - Implementacja POST handler
   - Walidacja request body za pomocą zod
   - Pobranie currentEmail z `locals.user.email`
   - Walidacja że newEmail !== currentEmail
   - Wywołanie `supabase.auth.updateUser({ email, options: { emailRedirectTo } })`
   - Obsługa błędów i zwrócenie odpowiedzi

5. **Utworzenie `src/pages/api/auth/delete-account.ts`:**
   - Implementacja POST handler
   - Walidacja hasła przez re-authentication
   - Inicjalizacja Supabase Admin Client
   - Wywołanie `supabaseAdmin.auth.admin.deleteUser(userId)`
   - Wylogowanie użytkownika przez `supabase.auth.signOut()`
   - Obsługa błędów i zwrócenie odpowiedzi

6. **Aktualizacja `src/pages/api/auth/callback.ts`:**
   - Dodanie obsługi typu `email_change`
   - Exchange code for session
   - Ustawienie cookie `show-email-change-success`
   - Redirect na `/settings`

### Faza 3: Implementacja komponentów formularzy (4-5h)

7. **Utworzenie `src/components/settings/ChangePasswordForm.tsx`:**
   - Setup react-hook-form z zodResolver i changePasswordSchema
   - Implementacja trzech FormField: currentPassword, newPassword, confirmPassword
   - Implementacja handleSubmit z wywołaniem API
   - Obsługa błędów i wyświetlanie toast
   - Stylizacja zgodna z brutalistycznym designem

8. **Utworzenie `src/components/settings/ChangeEmailForm.tsx`:**
   - Setup react-hook-form z zodResolver i changeEmailSchema
   - Wyświetlenie aktualnego e-maila (disabled input)
   - Implementacja FormField dla newEmail
   - Implementacja handleSubmit z wywołaniem API
   - Wyświetlenie komunikatu o weryfikacji po sukcesie
   - Obsługa błędów i wyświetlanie toast
   - Stylizacja zgodna z brutalistycznym designem

9. **Utworzenie `src/components/settings/DeleteAccountSection.tsx`:**
   - Implementacja sekcji "Danger Zone" z czerwonym tłem
   - Implementacja AlertDialog z shadcn/ui
   - Setup pola password w AlertDialog
   - Implementacja handleDelete z wywołaniem API
   - Obsługa błędów i wyświetlanie toast
   - Redirect na `/login` po sukcesie
   - Stylizacja zgodna z brutalistycznym designem

### Faza 4: Implementacja głównego widoku (2-3h)

10. **Utworzenie `src/components/settings/SettingsView.tsx`:**
    - Utworzenie głównej struktury komponentu
    - Dodanie nagłówka "ACCOUNT SETTINGS"
    - Integracja ChangePasswordForm
    - Integracja ChangeEmailForm
    - Integracja DeleteAccountSection w sekcji "Danger Zone"
    - Przekazanie props (userEmail) do odpowiednich komponentów
    - Stylizacja zgodna z brutalistycznym designem (sekcje oddzielone, padding, margins)

11. **Utworzenie `src/pages/settings.astro`:**
    - Import BrutalistLayout
    - Import SettingsView
    - Pobranie danych użytkownika z `Astro.locals.user`
    - Przekazanie userEmail do SettingsView
    - Setup client:load dla SettingsView

### Faza 5: Aktualizacja nawigacji (1h)

12. **Aktualizacja `src/layouts/BrutalistLayout.astro`:**
    - Dodanie linku "SETTINGS" w nawigacji obok DASHBOARD i ARCHIVE
    - Implementacja active state dla linku Settings (podświetlenie gdy currentPath === "/settings")
    - Dodanie separatora `|` między linkami

13. **Aktualizacja `src/middleware/index.ts`:**
    - Dodanie `/settings` do listy ścieżek chronionych (nie jest w PUBLIC_PATHS)
    - Weryfikacja, że middleware poprawnie obsługuje dostęp do `/settings`

### Faza 6: Testowanie i dopracowanie (2-3h)

15. **Dopracowanie UX:**
    - Weryfikacja poprawności komunikatów toast
    - Sprawdzenie spójności stylizacji z resztą aplikacji

16. **Dokumentacja:**
    - Aktualizacja PRD/dokumentacji o informacje o nowym widoku
    - Dodanie komentarzy w kodzie dla skomplikowanych logik
    - Aktualizacja README jeśli potrzebna

### Faza 7: Code review i finalizacja (1h)

17. **Code review:**
    - Sprawdzenie zgodności z konwencjami projektu
    - Weryfikacja typów TypeScript
    - Sprawdzenie obsługi błędów
    - Weryfikacja bezpieczeństwa (np. czy hasła nie są logowane)
