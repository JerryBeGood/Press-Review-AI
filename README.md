# Press Review AI

Press Review AI is an agentic web application designed to automate the process of creating regular press reviews on topics selected by the user.

In a world of information overload, staying up-to-date requires filtering through massive amounts of data. This application solves that problem by using an AI agent to autonomously search, analyze, and synthesize content into condensed, high-quality summaries.

> **Note**: This project is educational in nature and was created for the sake of certification in the 10xDevs 2.0 course.

## Tech Stack

This project leverages a modern, performance-oriented stack:

### Frontend

- **Framework**: [Astro 5](https://astro.build/) (Server-first, content-focused)
- **Interactivity**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)

### Backend & Infrastructure

- **BaaS**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Edge Functions)
- **Hosting**: Vercel

### Artificial Intelligence

- **Orchestration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **Search**: [Exa.js](https://exa.ai/)
- **Models**: OpenAI / Anthropic integration

### Testing

- **Unit Testing**: [Vitest](https://vitest.dev/)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Mocking**: MSW (Mock Service Worker)

## Getting Started Locally

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js**: Version `v24.4.1` (as specified in `.nvmrc`)
- **Package Manager**: npm, pnpm, or yarn
- **Supabase Account**: You will need a Supabase project for the database and authentication.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JerryBeGood/Press-Review-AI.git
   cd Press-Review-AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory. You will need to populate it with credentials for Supabase and your AI providers (e.g., OpenAI, Anthropic, Exa).

   _Example structure:_

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   EXA_API_KEY=your_exa_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:4321`.

## Available Scripts

| Script              | Description                                     |
| :------------------ | :---------------------------------------------- |
| `npm run dev`       | Starts the local development server with Astro. |
| `npm run build`     | Builds the project for production.              |
| `npm run preview`   | Previews the production build locally.          |
| `npm run test:unit` | Runs unit tests using Vitest.                   |
| `npm run test:e2e`  | Runs end-to-end tests using Playwright.         |
| `npm run lint`      | Runs ESLint to check for code quality issues.   |
| `npm run format`    | Formats code using Prettier.                    |

## Project Scope

The current MVP (Minimum Viable Product) includes the following core functionalities:

- **User Account Management**: Registration, email verification, login, password reset, and account deletion.
- **Press Release Scheduling**:
  - Create recurring press reviews by defining a topic.
  - Real-time topic validation by an AI agent.
  - Schedules: Daily, Weekly, or Monthly.
  - Limit: Up to 5 active schedules per user.
- **Content Generation**:
  - Autonomous gathering and synthesis of news by an AI agent.
  - Output format: General summary + 7-10 distinct segments with sources.
  - **Manual Generation**: Option to generate a review on-demand regardless of schedule.
- **Archives**: View chronological history of all generated press reviews.

## Project Status

This project is currently in the **MVP** phase. It includes all key features related to creating, editing, and viewing press releases. Future planned enhancements (not currently implemented) include advanced customization, notifications, and social media login.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
