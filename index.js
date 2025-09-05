import { openai } from '@ai-sdk/openai';
import { generateObject, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

import { prompts } from './prompts.js';

import 'dotenv/config';
import Exa from 'exa-js';

const mainModel = openai('gpt-4o-mini');



const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const exa = new Exa(process.env.EXASEARCH_API_KEY);

    const { results } = await exa.searchAndContents(query, {
      livecrawl: 'always',
      numResults: 3,
    });

    return results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.text,
      publicationDate: result.publishedDate,
    }));
  },
});

async function researchSubject(query) {
  const result = await generateObject({
    model: mainModel,
    output: 'array',
    schema: z.object({
      title: z.string(),
      url: z.string().url(),
      publicationDate: z.string(),
      source: z.string(),
      summary: z.string(),
    }),
    prompt: `Identify and summarise relevant information based on the provided query: ${query}. Return only the structured array.`,
    system: prompts.researcher.systemPrompt,
    tools: { webSearch },
    stopWhen: stepCountIs(10),
  });

  return result.object;
}

function validateSecrets() {
  const secrets = ['OPENAI_API_KEY', 'EXASEARCH_API_KEY'];

  for(const secret of secrets) {
    if (!process.env[secret]) {
      console.error(`Error: Missing ${secret}. Please set it in your environment or .env file.`);

      process.exit(1);
    }
  }
}

function prepareReport(subject, aggregated) {
  // Deduplicate by URL
  const seen = new Set();
  const unique = aggregated.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Compose Markdown content
  const today = new Date().toISOString().slice(0, 10);
  const subjectSlug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const lines = [];
  lines.push(`# Press Review: ${subject} (${today})`);
  lines.push('');
  lines.push('## Articles');
  lines.push('');
  for (const a of unique) {
    const host = a.source || (() => { try { return new URL(a.url).host; } catch { return ''; } })();
    lines.push(`- [${a.title}](${a.url})`);
    lines.push(`  - Date: ${a.publicationDate || 'N/A'} | Source: ${host}`);
    lines.push(`  - Summary: ${a.summary}`);
    lines.push('');
  }

  const report = lines.join('\n');

  // Write to reports directory
  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = path.join(reportsDir, `${today}-${subjectSlug || 'report'}.md`);
  fs.writeFileSync(reportPath, report, 'utf8');

  console.log(`Report saved to: ${reportPath}`);
}

async function main() {
  // Read subject from CLI; default to DEFAULT_SUBJECT or 'ai engineering' if not provided
  const args = process.argv.slice(2);
  let subject = args.join(' ').trim();
  if (!subject) {
    const fallback = process.env.DEFAULT_SUBJECT || 'ai engineering';
    console.log(`No subject provided via CLI. Defaulting to '${fallback}'.`);
    subject = fallback;
  }

  validateSecrets();

  const aggregated = [];
// const queries = await generateSearchQueries(subject);
// for (const query of queries) {
//   try {
//     const items = await researchSubject(query);
//     aggregated.push(...items);
//   } catch (err) {
//     console.error(`Research failed for query: "${query}"`, err);
    //   }
  // }

// prepareReport(subject, aggregated);
}

main();
