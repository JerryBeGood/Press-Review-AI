# Press Review AI - 10xDevs certification

[![Project Status: In Development](https://img.shields.io/badge/status-in%20development-yellowgreen.svg)](https://github.com/JerryBeGood/Press-Review-AI)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Press Review AI is a web application designed to automate the process of creating regular press reviews on topics selected by the user. The main purpose of the product is to provide users with condensed, accurate and high-quality information from various sources, allowing them to save time and stay up to date with the latest trends in their areas of interest. The application uses an AI agent to autonomously search, analyse and synthesise content.

This project is educational in nature and forms part of a portfolio.

## Table of Contents

- [Press Review AI](#press-review-ai)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Getting Started Locally](#getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [Included in the MVP](#included-in-the-mvp)
    - [Not Included in the MVP](#not-included-in-the-mvp)
  - [Project Status](#project-status)
  - [License](#license)

## Tech Stack

![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-000000?logo=supabase)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright)
![Testing Library](https://img.shields.io/badge/Testing_Library-E33332?logo=testing-library)
![MSW](https://img.shields.io/badge/MSW-FF6A33?logo=msw)

- **Frontend:**
  - **Astro 5:** Core framework for building fast, content-focused websites.
  - **React 19:** For creating interactive and dynamic UI components.
  - **TypeScript 5:** For strong typing and improved code quality.
  - **Tailwind 4:** A utility-first CSS framework for rapid UI development.
  - **Shadcn/ui:** A collection of accessible and reusable UI components.
- **Backend:**
  - **Supabase:** Provides a comprehensive backend solution, including:
    - PostgreSQL Database
    - Authentication
    - Backend-as-a-Service (BaaS) via SDKs
- **AI:**
  - **Vercel AI SDK:** A unified interface for communicating with various AI models (e.g., OpenAI, Anthropic).
- **DevOps:**
  - **GitHub Actions:** For CI/CD automation.
  - **DigitalOcean:** For hosting the application via Docker.
- **Testing:**
  - **Vitest:** A fast and modern test runner for unit and integration testing.
  - **Playwright:** For reliable end-to-end testing across different browsers.
  - **React Testing Library:** For testing React components.
  - **MSW (Mock Service Worker):** For mocking API requests during testing.

## Getting Started Locally

Follow these instructions to set up the project on your local machine for development and testing.

### Prerequisites

- Node.js (v18 or higher)
- npm (or your preferred package manager like pnpm or yarn)
- [Supabase Account](https://supabase.com/) or local Supabase setup.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/JerryBeGood/Press-Review-AI.git
    cd Press-Review-AI
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```sh
    cp .env.example .env
    ```

    You will need to add your Supabase Project URL and Anon Key to this file. You can find these in your Supabase project dashboard under `Project Settings` > `API`.

    ```env
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Set up the database:**
    If you are using the Supabase platform, you can run the migrations located in the `supabase/migrations` directory against your database. If you are running Supabase locally, you can use the Supabase CLI.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `dist/` folder.
- `npm run preview`: Serves the production build locally for preview.
- `npm run type-check`: Runs the TypeScript compiler to check for type errors.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

This section outlines the features included in the current Minimum Viable Product (MVP).

### Included in the MVP

- **User Account Management:** Registration, email verification, login, password/email changes, and account deletion.
- **Press Release Management:** Create, edit, and delete scheduled press releases.
- **Scheduling:** Set generation schedule (daily, weekly, monthly).
- **Content Generation:** Automatic and manual generation of press releases.
- **Limitations:** A limit of 5 scheduled press releases per user and unique titles for each.
- **Archive:** Access to a chronological list of all generated press releases.

### Not Included in the MVP

- Advanced press release customization (e.g., source filtering).
- Notification system.
- Login via social media accounts.
- AI agent customization for specific users.
- Monetization and subscription plans.
- Mechanism for evaluating the quality of generated content.

## Project Status

This project is currently **in development**. It is being built as an educational project to be included in a developer portfolio.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
