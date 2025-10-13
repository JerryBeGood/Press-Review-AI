# Press Review AI

Welcome to the official repository for Press Review AI. This document provides all the necessary information to understand, set up, and contribute to the project.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Press Review AI is a web application designed to automate the process of creating periodic press reviews on user-selected topics. The main goal of the product is to provide users with condensed, relevant, and high-quality information from various sources, saving them time and keeping them up-to-date with the latest trends in their areas of interest. The application uses an AI agent to autonomously search, analyze, and synthesize content.

This project is for educational purposes and serves as a portfolio piece.

## Tech Stack

The project uses a modern tech stack for both frontend and backend development:

### Frontend

- **[Astro 5](https://astro.build/)**: A web framework for building fast, content-driven websites.
- **[React 19](https://react.dev/)**: Used for creating interactive UI components.
- **[TypeScript 5](https://www.typescriptlang.org/)**: For static typing and improved developer experience.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: A utility-first CSS framework for styling.
- **[Shadcn/ui](https://ui.shadcn.com/)**: A collection of accessible and reusable UI components.

### Backend

- **[Supabase](https://supabase.io/)**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and a BaaS (Backend-as-a-Service) SDK.

### AI

- **[Vercel AI SDK](https://sdk.vercel.ai/)**: A unified programming interface for communicating with a wide range of AI models.

### CI/CD & Hosting

- **[GitHub Actions](https://github.com/features/actions)**: For continuous integration and deployment pipelines.
- **[DigitalOcean](https://www.digitalocean.com/)**: For hosting the application via a Docker image.

## Getting Started Locally

To run the project locally, follow these steps:

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/press_review_ai.git
    cd press_review_ai
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables. You will need to get these from your Supabase project dashboard.

    ```env
    PUBLIC_SUPABASE_URL="your-supabase-project-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm start`: Starts the development server.
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run astro`: Provides access to the Astro CLI.
- `npm run format`: Formats the code using Prettier.
- `npm run lint`: Lints the code using ESLint.

## Project Scope

### In Scope (MVP)

- Core features for creating, editing, and viewing press reviews.
- Basic user account management (registration, login, settings).
- Simple email notification system for press review generation status.
- A mechanism to rate the quality of generated content.

### Out of Scope

- Advanced customization options (e.g., source filtering, custom formatting).
- Push or SMS notifications.
- Social media login.
- AI agent personalization for individual users.
- Monetization and subscription plans.

## Project Status

The project is currently **under active development**. The main features planned for the MVP are:

- [ ] User Account Management (Registration, Auth, Profile)
- [ ] Press Review Management (Create, Edit, Delete)
- [ ] Automated Content Generation and Delivery
- [ ] Content Review and Rating System

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
