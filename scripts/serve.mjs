import { preview } from 'astro';

async function main() {
  const server = await preview({
    server: { port: 4321, host: '127.0.0.1' }
  });
  console.log('Astro preview server listening at:', server.resolvedUrls?.local?.[0] || 'http://127.0.0.1:4321/');
}

main().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
