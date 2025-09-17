import { PressReviewLeadAgent } from './agents/press_review_lead.js';

import 'dotenv/config';


function validateSecrets() {
  const secrets = ['OPENAI_API_KEY', 'EXASEARCH_API_KEY'];

  for(const secret of secrets) {
    if (!process.env[secret]) {
      console.error(`Error: Missing ${secret}. Please set it in your environment or .env file.`);

      process.exit(1);
    }
  }
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

  await leadAgent.run(subject);
}

main();
