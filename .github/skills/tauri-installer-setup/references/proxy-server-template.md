# Proxy Server Templates

Code examples for Phase 2 — Express proxy with health check and static serving.

## `server/proxy.cjs`

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = Number(process.env.PROXY_PORT ?? 5174);
const host = process.env.PROXY_HOST ?? '0.0.0.0';
const shouldServeStatic = process.env.SERVE_STATIC !== 'false';
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(process.cwd(), 'dist');

// --- Add your proxy routes here ---

app.get('/api/proxy', async (req, res) => {
  // Forward allowed requests to external APIs
});

// --- Health check (required by launcher) ---

app.get('/health', (_req, res) => {
  return res.json({ status: 'ok' });
});

// --- Static file serving for production ---

if (shouldServeStatic && fs.existsSync(staticDir)) {
  app.use(express.static(staticDir, { index: false }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(port, host, () => {
  console.log(`Proxy server listening on http://${host}:${port}`);
});
```

## Vite Dev Proxy

`vite.config.ts` server section:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5174',
    },
  },
})
```

## Dev Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:proxy": "node server/proxy.cjs",
    "dev:all": "concurrently \"npm run dev:proxy\" \"npm run dev\""
  }
}
```

```bash
npm install -D concurrently
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROXY_PORT` | `5174` | Port the proxy listens on |
| `PROXY_HOST` | `0.0.0.0` | Bind address (LAN-accessible by default) |
| `SERVE_STATIC` | `true` | Whether to serve Vite build output |
| `STATIC_DIR` | `./dist` | Path to the static asset directory |
