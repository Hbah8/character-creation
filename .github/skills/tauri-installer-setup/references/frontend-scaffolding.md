# Frontend Scaffolding Templates

Code examples for Phase 1 — setting up React + TypeScript + Vite + Tailwind 4.

## Create Vite Project

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

## Tailwind CSS 4

### Install

```bash
npm install tailwindcss @tailwindcss/postcss postcss autoprefixer
```

### `postcss.config.js`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `src/index.css`

```css
@import "tailwindcss";
```

## Path Aliases

### `tsconfig.app.json` (partial)

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `vite.config.ts` (alias section)

```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Testing — Vitest

### Install

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

### `vite.config.ts` (test section)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

### `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## ESLint

### Install

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
```

Create `eslint.config.js` with TypeScript + React rules.
