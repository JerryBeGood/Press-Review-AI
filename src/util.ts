function validateSecrets(): void {
    const secrets: string[] = ['OPENAI_API_KEY', 'EXASEARCH_API_KEY', 'ANTHROPIC_API_KEY'];
  
    for(const secret of secrets) {
      if (!process.env[secret]) {
        console.error(`Error: Missing ${secret}. Please set it in your environment or .env file.`);
  
        process.exit(1);
      }
    }
}

function escapeHtml(str: string): string {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export {
    validateSecrets,
    escapeHtml,
}