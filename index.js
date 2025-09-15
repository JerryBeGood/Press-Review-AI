import { generateObject, stepCountIs } from 'ai';
import { z } from 'zod';

import fs from 'fs';
import path from 'path';

import { PressReviewLeadAgent } from './agents/press_review_lead.js';
import { researcherPrompts } from './prompts.js';

import 'dotenv/config';


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
    prompt: researcherPrompts.input(query),
    system: researcherPrompts.system(),
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

// Read subject from CLI; default to DEFAULT_SUBJECT or 'ai engineering' if not provided
function readSubject() {
  const args = process.argv.slice(2);
  let subject = args.join(' ').trim();
  if (!subject) {
    const fallback = process.env.DEFAULT_SUBJECT || 'ai engineering';
    console.log(`No subject provided via CLI. Defaulting to '${fallback}'.`);
    subject = fallback;
  }

return subject;
}

async function main() {
  validateSecrets();

  const subject = readSubject();
  const leadAgent = new PressReviewLeadAgent();
  const result = await leadAgent.run('ai engineering');

  console.log(`${JSON.stringify(result)}`);
  
  // const aggregated = [];
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
