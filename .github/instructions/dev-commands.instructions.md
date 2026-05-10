# Developer Commands

```bash
npm run dev      # Vite dev server (port 5173), HMR via SWC
npm run build    # tsc -b && vite build (type-check then bundle)
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

**shadcn/ui CLI:**
```bash
npx shadcn@latest add <component>   # Add a new UI component
npx shadcn@latest diff               # Show what differs from upstream
```

**Imports**: Always use `@/` alias (maps to `src/`). Types use `import type` syntax.

**UI components**: Import from `@/components/ui/<component>`. Config lives in `components.json`.
