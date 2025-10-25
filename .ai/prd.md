# Product Requirements Document (PRD) - Press Review AI

## 1. Product Overview

Press Review AI is a web application designed to automate the process of creating regular press reviews on topics selected by the user. The main purpose of the product is to provide users with condensed, accurate and high-quality information from various sources, allowing them to save time and stay up to date with the latest trends in their areas of interest. The application uses an AI agent to autonomously search, analyse and synthesise content.

The project is educational in nature and forms part of a portfolio.

## 2. User problem

In today's world, the sheer volume of information makes it extremely time-consuming to keep up to date with the latest developments in a given field. This requires not only regularly browsing multiple sources, but also the ability to separate valuable content from information noise. Users need a tool that automates this process, providing them with ready-made, reliable and concise summaries on topics of interest to them.

## 3. Functional requirements

### 3.1. User account management

- Registration of a new user using an e-mail address and password.
- Verification of the email address via an activation link.
- Logging into the application using verified data.
- Ability to change the password and email address in the account settings.
- Ability to permanently delete the account along with all associated data.

### 3.2. Press release management

- Create a new, recurring press release by defining a topic.
- Real-time topic validation by an AI agent with feedback in the interface.
- Option to set a generation schedule: daily, weekly, monthly, with a specific time.
- There is a limit of 5 scheduled press releases per user.
- It is not possible to create more than one press release with the same title for a single user.
- Ability to edit the topic and schedule of existing press releases.
- Ability to delete a scheduled press release.

### 3.3. Content generation and delivery

- Automatic generation of press releases in English according to a set schedule.
- Each press release consists of a general summary and 7-10 individual segments (title, summary, link to source).
- The AI agent autonomously selects sources based on internal instructions.
- Saving logs from the news release generation process by the AI agent.
- Ability to manually generate a news release at the user's request.

### 3.4. Viewing

- Access to a chronological list of generated news releases (archive).

## 4. Product limitations

### What is included in the MVP

- Key features related to creating, editing and viewing press releases.
- Basic user account management (registration, login, settings).

### What is NOT included in the MVP

- Advanced press release customisation options (e.g. source filtering, formatting).
- Notification system.
- Social media login.
- AI agent customisation for specific users.
- Monetisation and subscription plans.
- Mechanism for evaluating the quality of generated content.

## 5. User stories

### 5.1. Account management

- ID: PRSR-001
- Title: New user registration
- Description: As a new user, I want to be able to register an account in the application using my email address and password to access its functionality.
- Acceptance criteria:
  - The registration form contains fields for an email address and password.
  - The system validates the correctness of the email address format.
  - The system requires a secure password (e.g. min. 8 characters).
  - After successful registration, a message with a verification link is sent to the provided email address.
  - The user cannot log in before verifying their email address.

- ID: PRSR-002
- Title: Email address verification
- Description: As a registered user, I want to be able to verify my email address by clicking on the link received in the message to activate my account.
- Acceptance criteria:
  - The verification link is unique and one-time.
  - After clicking on the link, the user is taken to a page confirming the activation of the account.
  - After successful verification, the account status changes to ‘active’.

- ID: PRSR-003
- Title: User login
- Description: As a verified user, I want to be able to log in to the application using my email address and password to manage my press releases.
- Acceptance criteria:
  - The login form contains fields for email address and password.
  - The system displays an error message if incorrect data is entered.
  - After successful login, the user is redirected to the main dashboard of the application.

- ID: PRSR-004
- Title: Change password
- Description: As a logged-in user, I want to be able to change my password in my account settings to secure my account.
- Acceptance criteria:
  - The password change form requires the old and new passwords to be entered.
  - The new password must meet security requirements.

- ID: PRSR-005
- Title: Change of e-mail address
- Description: As a logged-in user, I want to be able to change my e-mail address in my account settings.
- Acceptance criteria:
  - The user must confirm the change by clicking on the verification link sent to the new e-mail address.
  - The old email address remains active until the new one is verified.

- ID: PRSR-006
- Title: Account deletion
- Description: As a logged-in user, I want to be able to permanently delete my account along with all my data.
- Acceptance criteria:
  - The user must confirm their desire to delete their account (e.g. by entering their password).
  - After deleting the account, all user data (including press releases) is permanently deleted from the system.

### 5.2. Press release management

- ID: PRSR-007
- Title: Creating the first press release
- Description: As a new, logged-in user, when I enter the empty desktop, I want to see a clear button and message encouraging me to create my first press release.
- Acceptance criteria:
  - There is a visible CTA (Call To Action) element on the new user's desktop.
  - Clicking on the button takes me to the form for creating a new press release.

- ID: PRSR-008
- Title: Configuring a new press release
- Description: As a user, I want to be able to create a new press release by defining its topic and schedule (daily, weekly, monthly with exact time).
- Acceptance criteria:
  - The form contains a text field for the press release topic.
  - The form contains options for selecting the frequency (daily, weekly, monthly) and the exact time of generation.
  - When entering the topic, it is verified in real time by an AI agent.
  - The interface displays information about the topic validation status (correct/incorrect/suggestions).
  - The configuration can only be saved after successful topic validation.

- ID: PRSR-009
- Title: Reaching the press release limit
- Description: As a user with 5 scheduled press releases, when I try to create another one, I want to receive information about reaching the limit.
- Acceptance criteria:
  - The system prevents the creation of more than 5 scheduled press releases.
  - The user sees a message informing them of the limit.

- ID: PRSR-010
- Title: Managing the list of scheduled press releases
- Description: As a user, I want to have access to the list of my scheduled press releases so that I can edit or delete them.
- Acceptance criteria:
  - A dedicated subpage displays a list of all scheduled press releases.
  - Each item on the list contains information about the topic and schedule.
  - Each item has ‘Edit’ and ‘Delete’ options.

- ID: PRSR-011
- Title: Editing a scheduled press release
- Description: As a user, I want to be able to edit the topic and schedule of an existing press release.
- Acceptance criteria:
  - The edit form is pre-filled with the current press release data.
  - The topic change is subject to re-validation by an AI agent.
  - Changes are saved and applied from the next generation cycle.

- ID: PRSR-012
- Title: Deleting a scheduled press release
- Description: As a user, I want to be able to delete a scheduled press release to stop it from being generated.
- Acceptance criteria:
  - The system asks for confirmation of deletion.
  - Upon confirmation, the press release is removed from the scheduled list and is no longer generated.

- ID: PRSR-013
- Title: Manually generate a press release on demand
- Description: As a user, I want to be able to manually generate the current press release regardless of the schedule.
- Acceptance criteria:
  - There is a ‘Generate now’ button in the press release list and in the press release details view.
  - After clicking, the generation process starts with immediate progress feedback.
  - After generation is complete, the new version of the press release appears in the archive with the current date.
  - Manual generation does not affect future scheduled generations.

- ID: PRSR-014
- Title: Preventing duplicate press release titles
- Description: As a user, I want to be informed that I cannot create two press releases with the same title to avoid confusion and duplication of content.
- Acceptance criteria:
  - The system checks the uniqueness of the press release title within the user's account when creating a new press release.
  - If the user attempts to create a press release with a title that already exists, an error message is displayed.
  - The message informs the user that they must choose a different title.
  - Title uniqueness validation also works when editing an existing press release.
  - Saving a press release is only possible after selecting a unique title.

### 5.3. Browsing

- ID: PRSR-015
- Title: Browsing the press release archive
- Description: As a user, I want to have access to an archive of all my generated press releases so that I can browse them at any time.
- Acceptance criteria:
  - The archive is available on a dedicated subpage.
  - Press releases are arranged chronologically (from the most recent).
  - Each item on the list leads to the full content of the press release.

- ID: PRSR-016
- Title: Reading press releases
- Description: As a user, after selecting a press release from the archive, I want to see its full content, including a general summary.
- Acceptance criteria:
  - The content is legible and well formatted.
  - Each segment contains a title, summary, and clickable link to the original article.

## 6. Success metrics

1. System stability:
   - Goal: Scheduled press releases are generated without errors on the set dates.
   - Measurement: Manual monitoring of system logs to identify failed generations and verify successful ones.
