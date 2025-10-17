# Architektura UI dla Press Review AI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Press Review AI opiera się na frameworku Astro, z dynamicznymi i interaktywnymi komponentami ("wyspami") budowanymi w React. Centralnym punktem nawigacyjnym jest boczny pasek (sidebar), który zapewnia dostęp do kluczowych widoków aplikacji. Zarządzanie stanem serwera jest realizowane przez bibliotekę TanStack Query, co gwarantuje efektywne pobieranie, buforowanie i synchronizację danych z API. Formularze są obsługiwane przez React Hook Form z walidacją schematów Zod. Interfejs jest zbudowany z gotowych komponentów Shadcn/ui, co zapewnia spójność wizualną i wysoką dostępność. Architektura jest zaprojektowana z myślą o desktopach i koncentruje się na zapewnieniu płynnego, reaktywnego doświadczenia użytkownika poprzez jasne komunikowanie stanu aplikacji.

## 2. Lista widoków

### Widok: Uwierzytelnianie (Auth)

- **Ścieżka:** `/auth`
- **Główny cel:** Umożliwienie nowym użytkownikom rejestracji, a istniejącym zalogowania się do aplikacji. Widok ten jest niedostępny dla zalogowanych użytkowników.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania i rejestracji.
- **Kluczowe komponenty:**
  - `AuthForm`: Komponent-kontener z zakładkami (`Tabs`) do przełączania między logowaniem a rejestracją.
  - `LoginForm`: Formularz z polami na e-mail i hasło.
  - `RegisterForm`: Formularz z polami na e-mail i hasło.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wyraźne komunikaty o błędach walidacji i nieprawidłowych danych logowania. Przycisk przesyłania jest dezaktywowany podczas operacji.
  - **Dostępność:** Poprawne etykiety formularzy i zarządzanie focusem.
  - **Bezpieczeństwo:** Użycie pola typu `password`. Trasy chronione są przez middleware Astro, który przekierowuje niezalogowanych użytkowników do `/auth`.

### Widok: Pulpit (Dashboard)

- **Ścieżka:** `/`
- **Główny cel:** Wyświetlanie i zarządzanie listą zaplanowanych prasówek. To główny ekran aplikacji po zalogowaniu.
- **Kluczowe informacje do wyświetlenia:** Lista zaplanowanych prasówek z ich tematem i harmonogramem. Stan pusty z wezwaniem do działania (CTA) dla nowych użytkowników.
- **Kluczowe komponenty:**
  - `PressReviewList`: Wyświetla listę zaplanowanych prasówek.
  - `PressReviewListItem`: Reprezentuje pojedynczą prasówkę z przyciskami akcji (`Edytuj`, `Usuń`, `Generuj teraz`).
  - `PressReviewFormDialog`: Okno modalne (`Dialog`) z formularzem do tworzenia i edycji prasówki.
  - `AlertDialog`: Potwierdzenie usunięcia prasówki.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Użycie szkieletów interfejsu (`Skeleton`) podczas ładowania danych. Optymistyczne aktualizacje przy usuwaniu dla płynniejszego doświadczenia.
  - **Dostępność:** Etykiety `aria-label` dla przycisków-ikon.
  - **Bezpieczeństwo:** Dostęp do widoku i wszystkie operacje wymagają uwierzytelnienia.

### Widok: Archiwum (Archive)

- **Ścieżka:** `/archive`
- **Główny cel:** Przeglądanie historii wszystkich wygenerowanych prasówek.
- **Kluczowe informacje do wyświetlenia:** Chronologiczna lista wygenerowanych prasówek z datą, tematem i statusem (`oczekująca`, `sukces`, `nieudana`).
- **Kluczowe komponenty:**
  - `GeneratedPressReviewList`: Wyświetla listę wygenerowanych prasówek.
  - `GeneratedPressReviewListItem`: Reprezentuje pojedynczy wpis w archiwum.
  - `Badge`: Komponent do wizualnego przedstawienia statusu generacji.
  - `GeneratedPressReviewContentDialog`: Okno modalne (`Dialog`) wyświetlające pełną treść wygenerowanej prasówki.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Automatyczne odświeżanie (polling) statusu dla prasówek w toku. Komunikat o błędzie i opcja ponowienia dla nieudanych generacji.
  - **Dostępność:** Okno modalne z treścią prasówki blokuje focus wewnątrz siebie.
  - **Bezpieczeństwo:** Dostęp do widoku wymaga uwierzytelnienia.

### Widok: Ustawienia (Settings)

- **Ścieżka:** `/settings`
- **Główny cel:** Zarządzanie kontem użytkownika, w tym zmiana hasła, adresu e-mail i usunięcie konta.
- **Kluczowe informacje do wyświetlenia:** Formularze do zmiany danych uwierzytelniających oraz wydzielona "strefa niebezpieczeństwa".
- **Kluczowe komponenty:**
  - `ChangePasswordForm`: Formularz do zmiany hasła.
  - `ChangeEmailForm`: Formularz do zmiany adresu e-mail.
  - `DeleteAccountSection`: Sekcja z przyciskiem do usunięcia konta.
  - `AlertDialog`: Potwierdzenie usunięcia konta.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty (toasts) po pomyślnej zmianie danych. Usunięcie konta wymaga dodatkowego potwierdzenia (np. wpisania hasła) w celu uniknięcia pomyłki.
  - **Dostępność:** Poprawne etykiety formularzy i komunikaty.
  - **Bezpieczeństwo:** Zmiana hasła wymaga podania starego hasła. Usunięcie konta jest operacją krytyczną i wymaga ponownego uwierzytelnienia.

## 3. Mapa podróży użytkownika

**Główny przepływ dla nowego użytkownika:**

1.  **Rejestracja:** Użytkownik trafia na widok `Uwierzytelnianie` (`/auth`), wypełnia formularz rejestracyjny i otrzymuje e-mail weryfikacyjny.
2.  **Logowanie:** Po weryfikacji e-maila, użytkownik loguje się i zostaje przekierowany na `Pulpit` (`/`).
3.  **Tworzenie prasówki:** Na `Pulpicie` klika CTA, co otwiera `PressReviewFormDialog`. Wypełnia temat (z walidacją w czasie rzeczywistym) i harmonogram, a następnie zapisuje. Nowa prasówka pojawia się na liście.
4.  **Generowanie na żądanie:** Użytkownik klika przycisk `Generuj teraz` przy nowo utworzonej prasówce.
5.  **Przeglądanie w archiwum:** Przechodzi do widoku `Archiwum` (`/archive`), gdzie widzi swoją prasówkę ze statusem `oczekująca`. Status jest automatycznie odświeżany.
6.  **Czytanie treści:** Gdy status zmieni się na `sukces`, użytkownik klika na element, co otwiera `GeneratedPressReviewContentDialog` z pełną treścią prasówki.
7.  **Zarządzanie kontem:** W dowolnym momencie użytkownik może przejść do `Ustawień` (`/settings`), aby zmienić swoje hasło lub usunąć konto.

## 4. Układ i struktura nawigacji

- **Główny układ:** Aplikacja wykorzystuje stały układ z bocznym panelem nawigacyjnym (sidebar) i głównym obszarem treści.
- **Nawigacja główna (Sidebar):**
  - Link do `Pulpitu` (`/`)
  - Link do `Archiwum` (`/archive`)
- **Nawigacja użytkownika:**
  - Link do `Ustawień` (`/settings`)
  - Przycisk `Wyloguj`
- **Ochrona tras (Route Guarding):** Wszystkie widoki z wyjątkiem `/auth` są chronione. Próba dostępu bez uwierzytelnienia skutkuje przekierowaniem do strony logowania.

## 5. Kluczowe komponenty

- **`Layout`:** Główny komponent otaczający widoki, zawierający boczny panel nawigacyjny i nagłówek. Odpowiada za spójną strukturę aplikacji.
- **`PressReviewFormDialog`:** Reużywalne okno modalne do tworzenia i edycji zaplanowanych prasówek. Zawiera logikę formularza, walidację tematu w czasie rzeczywistym i obsługę przesyłania danych do API.
- **`GeneratedPressReviewContentDialog`:** Okno modalne wyświetlające sformatowaną treść wygenerowanej prasówki, w tym podsumowanie i poszczególne segmenty z linkami do źródeł.
- **`Toast`:** Komponent do wyświetlania globalnych, nieblokujących powiadomień (np. o sukcesie operacji lub błędzie API).
- **`AlertDialog`:** Komponent modalny używany do uzyskania od użytkownika potwierdzenia wykonania destrukcyjnej akcji (np. usunięcia prasówki lub konta).
- **`Skeleton`:** Komponent używany jako placeholder podczas ładowania danych, poprawiający postrzeganą wydajność aplikacji.
