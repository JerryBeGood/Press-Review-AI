function validateSecrets() {
    const secrets = ['OPENAI_API_KEY', 'EXASEARCH_API_KEY'];
  
    for(const secret of secrets) {
      if (!process.env[secret]) {
        console.error(`Error: Missing ${secret}. Please set it in your environment or .env file.`);
  
        process.exit(1);
      }
    }
}

function escapeHtml(str) {
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