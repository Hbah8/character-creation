# Developer Commands

```bash
npm run dev      # Vite dev server (port 5173), HMR via SWC
npm run build    # tsc -b && vite build (type-check then bundle)
npm run lint     # ESLint
npm run check    # Required feature gate: lint, tests, TypeScript check, and production build
npm run preview  # Preview production build locally
```

Run `npm run check` after completing each feature and before considering the work complete. Resolve every lint, test, type-check, or build failure; do not treat a failing check as an acceptable baseline.

**shadcn/ui CLI:**
```bash
npx shadcn@latest add <component>   # Add a new UI component
npx shadcn@latest diff               # Show what differs from upstream
```

**Imports**: Always use `@/` alias (maps to `src/`). Types use `import type` syntax.

**UI components**: Import from `@/components/ui/<component>`. Config lives in `components.json`.
