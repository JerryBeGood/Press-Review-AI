# Dokument wymagań produktu (PRD) - Press Review AI

## 1. Przegląd produktu

Press Review AI to aplikacja internetowa zaprojektowana w celu automatyzacji procesu tworzenia cyklicznych przeglądów prasowych na wybrane przez użytkownika tematy. Głównym celem produktu jest dostarczanie użytkownikom skondensowanych, trafnych i wysokiej jakości informacji z różnych źródeł, co pozwala im zaoszczędzić czas i być na bieżąco z najnowszymi trendami w interesujących ich dziedzinach. Aplikacja wykorzystuje agenta AI do autonomicznego wyszukiwania, analizy i syntezy treści.

Projekt ma charakter edukacyjny i stanowi element portfolio.

## 2. Problem użytkownika

W dzisiejszym świecie natłok informacji sprawia, że bycie na bieżąco z nowinkami w danej dziedzinie jest niezwykle czasochłonne. Wymaga to nie tylko regularnego przeglądania wielu źródeł, ale także umiejętności oddzielania wartościowych treści od informacyjnego szumu. Użytkownicy potrzebują narzędzia, które zautomatyzuje ten proces, dostarczając im gotowe, wiarygodne i zwięzłe podsumowania na interesujące ich tematy.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika

- Rejestracja nowego użytkownika przy użyciu adresu e-mail i hasła.
- Weryfikacja adresu e-mail poprzez link aktywacyjny.
- Logowanie do aplikacji za pomocą zweryfikowanych danych.
- Możliwość zmiany hasła i adresu e-mail w ustawieniach konta.
- Możliwość trwałego usunięcia konta wraz ze wszystkimi powiązanymi danymi.

### 3.2. Zarządzanie prasówkami

- Tworzenie nowej, cyklicznej prasówki poprzez zdefiniowanie tematu.
- Walidacja tematu przez agenta AI w czasie rzeczywistym z informacją zwrotną w interfejsie.
- Możliwość ustawienia harmonogramu generowania: codziennie, co tydzień, co miesiąc, z dokładnym określeniem czasu.
- Obowiązuje limit do 5 aktywnych (zaplanowanych) prasówek na jednego użytkownika.
- Możliwość edycji tematu i harmonogramu istniejących prasówek.
- Możliwość usunięcia zaplanowanej prasówki.

### 3.3. Generowanie i dostarczanie treści

- Automatyczne generowanie prasówek w języku angielskim zgodnie z ustalonym harmonogramem.
- Każda prasówka składa się z ogólnego podsumowania oraz 7-10 indywidualnych segmentów (tytuł, streszczenie, link do źródła).
- Agent AI autonomicznie dobiera źródła na podstawie wewnętrznych instrukcji.
- Zapisywanie logów z procesu generacji prasówki przez agenta AI.
- Możliwość ręcznego wygenerowania prasówki na żądanie użytkownika.

### 3.4. Przeglądanie

- Dostęp do chronologicznej listy wygenerowanych prasówek (archiwum).

## 4. Granice produktu

### Co wchodzi w zakres MVP

- Kluczowe funkcje związane z tworzeniem, edycją i przeglądaniem prasówek.
- Podstawowe zarządzanie kontem użytkownika (rejestracja, logowanie, ustawienia).

### Co NIE wchodzi w zakres MVP

- Zaawansowane opcje personalizacji prasówek (np. filtracja źródeł, formatowanie).
- System powiadomień.
- Logowanie za pośrednictwem mediów społecznościowych.
- Personalizacja agenta AI pod konkretnego użytkownika.
- Monetyzacja i plany subskrypcyjne.
- Mechanizm oceny jakości wygenerowanych treści.

## 5. Historyjki użytkowników

### 5.1. Zarządzanie kontem

- ID: PRSR-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc zarejestrować konto w aplikacji za pomocą adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - System waliduje poprawność formatu adresu e-mail.
  - System wymaga bezpiecznego hasła (np. min. 8 znaków).
  - Po pomyślnej rejestracji na podany adres e-mail wysyłana jest wiadomość z linkiem weryfikacyjnym.
  - Użytkownik nie może zalogować się przed weryfikacją adresu e-mail.

- ID: PRSR-002
- Tytuł: Weryfikacja adresu e-mail
- Opis: Jako zarejestrowany użytkownik, chcę móc zweryfikować swój adres e-mail klikając w link otrzymany w wiadomości, aby aktywować swoje konto.
- Kryteria akceptacji:
  - Link weryfikacyjny jest unikalny i jednorazowy.
  - Po kliknięciu w link użytkownik jest przenoszony na stronę z potwierdzeniem aktywacji konta.
  - Po pomyślnej weryfikacji status konta zmienia się na "aktywne".

- ID: PRSR-003
- Tytuł: Logowanie użytkownika
- Opis: Jako zweryfikowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby móc zarządzać swoimi prasówkami.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - System wyświetla komunikat o błędzie w przypadku podania nieprawidłowych danych.
  - Po pomyślnym zalogowaniu użytkownik jest przekierowywany na główny pulpit aplikacji.

- ID: PRSR-004
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik, chcę móc zmienić swoje hasło w ustawieniach konta, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  - Formularz zmiany hasła wymaga podania starego i nowego hasła.
  - Nowe hasło musi spełniać wymogi bezpieczeństwa.
  - Po pomyślnej zmianie hasła użytkownik otrzymuje powiadomienie e-mail.

- ID: PRSR-005
- Tytuł: Zmiana adresu e-mail
- Opis: Jako zalogowany użytkownik, chcę móc zmienić swój adres e-mail w ustawieniach konta.
- Kryteria akceptacji:
  - Użytkownik musi potwierdzić zmianę, klikając w link weryfikacyjny wysłany na nowy adres e-mail.
  - Stary adres e-mail pozostaje aktywny do momentu weryfikacji nowego.

- ID: PRSR-006
- Tytuł: Usunięcie konta
- Opis: Jako zalogowany użytkownik, chcę móc trwale usunąć swoje konto wraz ze wszystkimi danymi.
- Kryteria akceptacji:
  - Użytkownik musi potwierdzić chęć usunięcia konta (np. poprzez wpisanie hasła).
  - Po usunięciu konta wszystkie dane użytkownika (w tym prasówki) są trwale usuwane z systemu.

### 5.2. Zarządzanie prasówkami

- ID: PRSR-007
- Tytuł: Tworzenie pierwszej prasówki
- Opis: Jako nowy, zalogowany użytkownik, po wejściu na pusty pulpit chcę zobaczyć wyraźny przycisk i komunikat zachęcający do stworzenia pierwszej prasówki.
- Kryteria akceptacji:
  - Na pulpicie nowego użytkownika znajduje się widoczny element CTA (Call To Action).
  - Kliknięcie w przycisk przenosi do formularza tworzenia nowej prasówki.

- ID: PRSR-008
- Tytuł: Konfiguracja nowej prasówki
- Opis: Jako użytkownik, chcę móc stworzyć nową prasówkę, definiując jej temat oraz harmonogram (codziennie, tygodniowo, miesięcznie z dokładnym czasem).
- Kryteria akceptacji:
  - Formularz zawiera pole tekstowe na temat prasówki.
  - Formularz zawiera opcje wyboru częstotliwości (codziennie, tygodniowo, miesięcznie) i dokładnego czasu generowania.
  - Podczas wpisywania tematu, jest on weryfikowany w czasie rzeczywistym przez agenta AI.
  - Interfejs wyświetla informację o statusie walidacji tematu (poprawny/niepoprawny/sugestie).
  - Zapisanie konfiguracji jest możliwe tylko po pomyślnej walidacji tematu.

- ID: PRSR-009
- Tytuł: Osiągnięcie limitu prasówek
- Opis: Jako użytkownik posiadający 5 aktywnych prasówek, przy próbie stworzenia kolejnej chcę otrzymać informację o osiągnięciu limitu.
- Kryteria akceptacji:
  - System uniemożliwia stworzenie więcej niż 5 aktywnych prasówek.
  - Użytkownik widzi komunikat informujący o limicie.

- ID: PRSR-010
- Tytuł: Zarządzanie listą aktywnych prasówek
- Opis: Jako użytkownik, chcę mieć dostęp do listy moich aktywnych prasówek, aby móc je edytować lub usuwać.
- Kryteria akceptacji:
  - Dedykowana podstrona wyświetla listę wszystkich zaplanowanych prasówek.
  - Każdy element na liście zawiera informacje o temacie i harmonogramie.
  - Przy każdym elemencie znajdują się opcje "Edytuj" i "Usuń".

- ID: PRSR-011
- Tytuł: Edycja zaplanowanej prasówki
- Opis: Jako użytkownik, chcę móc edytować temat i harmonogram istniejącej prasówki.
- Kryteria akceptacji:
  - Formularz edycji jest pre-wypełniony aktualnymi danymi prasówki.
  - Zmiana tematu podlega ponownej walidacji przez agenta AI.
  - Zmiany są zapisywane i stosowane od następnego cyklu generowania.

- ID: PRSR-012
- Tytuł: Usunięcie zaplanowanej prasówki
- Opis: Jako użytkownik, chcę móc usunąć zaplanowaną prasówkę, aby zatrzymać jej generowanie.
- Kryteria akceptacji:
  - System prosi o potwierdzenie usunięcia.
  - Po potwierdzeniu prasówka jest usuwana z listy aktywnych i przestaje być generowana.

- ID: PRSR-013
- Tytuł: Ręczne wygenerowanie prasówki na żądanie
- Opis: Jako użytkownik, chcę móc ręcznie wygenerować bieżącą prasówkę niezależnie od harmonogramu.
- Kryteria akceptacji:
  - Na liście prasówek oraz w widoku szczegółów prasówki znajduje się przycisk "Generuj teraz".
  - Po kliknięciu rozpoczyna się proces generacji z natychmiastowym feedbackiem postępu.
  - Po zakończeniu generacji nowa wersja prasówki pojawia się w archiwum z aktualną datą.
  - Ręczne wygenerowanie nie wpływa na przyszłe zaplanowane generacje.

### 5.3. Przeglądanie

- ID: PRSR-014
- Tytuł: Przeglądanie archiwum prasówek
- Opis: Jako użytkownik, chcę mieć dostęp do archiwum wszystkich moich wygenerowanych prasówek, aby móc je przeglądać w dowolnym momencie.
- Kryteria akceptacji:
  - Archiwum jest dostępne na dedykowanej podstronie.
  - Prasówki są ułożone chronologicznie (od najnowszej).
  - Każdy element na liście prowadzi do pełnej treści prasówki.

- ID: PRSR-015
- Tytuł: Czytanie prasówki
- Opis: Jako użytkownik, po wybraniu prasówki z archiwum, chcę widzieć jej pełną treść, w tym ogólne podsumowanie oraz poszczególne segmenty z linkami do źródeł.
- Kryteria akceptacji:
  - Treść jest czytelna i dobrze sformatowana.
  - Każdy segment zawiera tytuł, streszczenie i klikalny link do oryginalnego artykułu.

## 6. Metryki sukcesu

1. Stabilność systemu:
   - Cel: Zaplanowane prasówki generują się bez błędów w ustalonych terminach.
   - Pomiar: Manualne monitorowanie logów systemowych w celu identyfikacji nieudanych generacji i weryfikacji udanych.
