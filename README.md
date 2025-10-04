# Press-Review-AI

A modern web application built with Astro, React, and AI SDK that researches topics using AI agents and presents findings in an interactive web interface.

## Tech Stack

- **Frontend**: Astro 5.x with React 19
- **Styling**: Tailwind CSS 4.x
- **AI**: OpenAI SDK with Anthropic Claude
- **Search**: Exa Search API
- **Language**: TypeScript with strict configuration
- **Code Quality**: ESLint + Prettier with Husky pre-commit hooks

## Prerequisites

- Node.js 18+ (recommended 20+)
- An OpenAI API key (`OPENAI_API_KEY`)
- An Exa Search API key (`EXASEARCH_API_KEY`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...your-key...
EXASEARCH_API_KEY=exakey_...your-key...
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## API Usage

The application provides a REST API endpoint:

```
GET /api/press_review?subject=<topic>
```

**Parameters:**

- `subject` (optional): Research topic (defaults to "ai engineering")

**Response:** JSON array of research findings and analysis steps

## Features

- **Interactive Web Interface**: Modern React-based UI with real-time loading states
- **AI-Powered Research**: Uses Claude and OpenAI for intelligent topic analysis
- **Real-time Search**: Integrates with Exa Search for current information
- **Type Safety**: Full TypeScript support with strict configuration
- **Code Quality**: Automated linting and formatting with pre-commit hooks
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Project Structure

```
src/
├── agents/          # AI agent implementations
├── components/      # React components
├── layouts/         # Astro layouts
├── pages/           # Astro pages and API routes
├── styles/          # Global CSS styles
├── types/           # TypeScript type definitions
└── util.ts          # Utility functions
```

## Troubleshooting

- **Missing API keys**: Ensure `OPENAI_API_KEY` and `EXASEARCH_API_KEY` are set in `.env`
- **Type errors**: Run `npm run type-check` to identify TypeScript issues
- **Linting issues**: Run `npm run lint:fix` to automatically fix code style issues
- **Build errors**: Check that all dependencies are installed with `npm install`

## Notes

- The application uses paid APIs (OpenAI, Exa). Monitor usage and costs.
- Results are optimized for web display with interactive components.
- The codebase follows modern development practices with automated quality checks.
