# Common Tasks

**Add a new page**: Create in `src/pages/`, add `<Route>` in `App.tsx`, add entry to `NAV_ITEMS` in `components/layout/Navbar.tsx`.

**Add a shadcn/ui component**: Run `npx shadcn@latest add <name>`. Component appears in `src/components/ui/`. Import via `@/components/ui/<name>`.

**Replace custom UI with shadcn**: When refactoring, prefer shadcn `<Button>`, `<Card>`, `<Dialog>`, `<Select>`, `<Input>`, `<Badge>` etc. over hand-rolled equivalents. Always use `cn()` for class merging.