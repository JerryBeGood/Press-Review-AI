# Press-Review-AI

Agentic web application (Node.js + AI SDK) that researches a topic using AI agents, aggregates findings, and produces a concise Markdown press review.

## Prerequisites

- Node.js 18+ (recommended 20+)
- An OpenAI API key (`OPENAI_API_KEY`)
- An Exa Search API key (`EXASEARCH_API_KEY`)

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-...your-key...
EXASEARCH_API_KEY=exakey_...your-key...
# Optional default when no subject is provided on CLI
DEFAULT_SUBJECT=ai engineering
```

## Running

Basic usage (defaults to `DEFAULT_SUBJECT` or 'ai engineering'):

```
node index.js
```

With a specific subject:

```
node index.js "webgpu adoption"
```

The script will:

- Generate focused research queries for the subject
- Search recent sources via Exa and summarize findings
- Aggregate and deduplicate results
- Save a Markdown report to `reports/YYYY-MM-DD-<subject-slug>.md`

On success, the console prints the path to the saved report.

## Output

Example file path:

```
reports/2025-08-25-ai-engineering.md
```

## Troubleshooting

- Missing API keys: ensure `OPENAI_API_KEY` and `EXASEARCH_API_KEY` are set in `.env` or your environment.
- Permissions: if the `reports/` directory cannot be created, check filesystem permissions.
- Network issues: rerun; transient errors during search can be retried.

## Notes

- Running this script will invoke paid APIs. Monitor usage and costs.
- Results are limited and focused to keep reports concise; adjust logic as needed.
