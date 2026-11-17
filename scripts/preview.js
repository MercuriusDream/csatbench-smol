// Serves dist/ the way GitHub Pages will. Run after a build.
const root = new URL('../dist/', import.meta.url).pathname;
const server = Bun.serve({
  port: Number(process.env.PORT ?? 4173),
  async fetch(request) {
    const path = decodeURIComponent(new URL(request.url).pathname);
    const file = Bun.file(root + (path.endsWith('/') ? `${path}index.html` : path).slice(1));
    return (await file.exists()) ? new Response(file) : new Response('Not found', { status: 404 });
  },
});
console.log(`Serving dist/ at http://localhost:${server.port}`);
