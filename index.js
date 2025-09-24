import express from 'express';

import { PressReviewLeadAgent } from './agents/press_review_lead.js';
import { validateSecrets, escapeHtml } from './util.js';

import 'dotenv/config';

const app = express();

app.get('/', async (req, res) => {
  validateSecrets();

  const subject = 'ai engineering';
  const leadAgent = new PressReviewLeadAgent();
  const response = await leadAgent.run(subject);

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Press Review AI</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; line-height: 1.5; }
      h1 { margin-top: 0; font-size: 1.25rem; }
      pre { background: #0b1020; color: #e6edf3; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
      .container { max-width: 960px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Press Review: ${escapeHtml(subject)}</h1>
      <pre>${escapeHtml(response)}</pre>
    </div>
  </body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
  res.end();
});

app.listen(3000);

