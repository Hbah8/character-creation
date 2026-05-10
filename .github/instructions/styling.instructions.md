# Styling

## Tailwind CSS 4 + shadcn/ui

Tailwind CSS 4 with `@theme` custom properties in `index.css`.

### UI Component Library: shadcn/ui

Pre-built accessible components in `src/components/ui/`. Config in `components.json` (style: `new-york`, icons: `lucide`).

**Available components:**
`button`, `card`, `badge`, `dialog`, `tooltip`, `separator`, `input`, `label`, `select`, `tabs`, `sheet`, `scroll-area`

**Adding new shadcn components:**
```bash
npx shadcn@latest add <component-name>
```

**Usage example:**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

shadcn/ui uses `class-variance-authority` (cva) for variants and `tailwind-merge` via `cn()` for class composition.

### SWADE Custom Theme Tokens
```
swade-gold / swade-gold-light / swade-gold-dark  — accent/brand colors
swade-bg (#1a1a2e) / swade-surface (#16213e) / swade-surface-light (#1f3460) — backgrounds
swade-accent (#e94560) — destructive/warning
swade-text / swade-text-muted — text colors
```

shadcn CSS variables (`--primary`, `--background`, etc.) are mapped to SWADE dark theme colors in `:root`.

### Utilities

Use `cn()` from `lib/utils.ts` (wraps `clsx` + `twMerge`) for conditional classes. Icons via `lucide-react`.

### Common patterns
- Cards: `bg-swade-surface rounded-lg border border-swade-surface-light` or shadcn `<Card>`
- Buttons: `<Button>` from shadcn or `bg-swade-gold text-swade-bg hover:bg-swade-gold-light transition-colors`
- Points display: three-state color (negative → red, zero → gold, positive → emerald)
- Error messages: `bg-red-900/30 text-red-300 border border-red-900/50`
- Dialogs/Modals: use shadcn `<Dialog>` for accessibility
- Tooltips: use shadcn `<Tooltip>` with `<TooltipProvider>` at app root
