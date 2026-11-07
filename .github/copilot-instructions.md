# SWADE Campaign Manager - AI Coding Instructions

> For the full platform architecture and long-term vision, see `PLATFORM.md`.

## Platform Overview

This is a client-side TTRPG campaign management platform built on the SWADE system. The **World** is the root context for all content: characters, locations, NPCs, quests, shops, handbooks, and setting rules.

The sidebar provides navigation between modules. The World Picker at the top of the sidebar determines the active world context for all modules.

Sidebar modules (current and planned):
- Combat Tracker
- Characters
- Handbooks (system-level SWADE + world-level overrides/additions)
- Race Builder
- World Geography
- Cities / Locations
- Shops
- NPCs
- Quests
- Bestiary

## World Contract

A World is the root container. It holds:
- `settingRules` — overrides for SWADE defaults (e.g. skill points budget)
- `entities` and `relationships` — the internal graph of all world content

Characters may belong to a world (`worldId`) or exist standalone. When a character has a `worldId`, the editor reads `settingRules` from that world instead of SWADE defaults.

The world graph is the backend representation of all connections. Users interact through **forms** — each form shows the relevant slice of the graph for its entity type. Do not treat the graph visualizer as the primary editing interface.

## Handbook Contract

Handbooks (edges, hindrances, weapons, powers, etc.) operate on two levels:

1. **System level** — hardcoded SWADE content, read-only
2. **World level** — stored in the World, can add new entries or override system entries within that world's context

Never merge world-level overrides into system-level data. Always resolve at read time.

## Character Editor Contract

The character editor flow remains:
1. UI Form → UI Preview → Export to PDF
2. UI Form → UI Preview → Export to JSON
3. Import from JSON → UI Form + UI Preview

The form is the editable source of truth. The preview is the rendered representation. Exports reflect the current preview state.

`settingRules` (skill/attribute point budgets) are resolved from the character's world at edit time and are **not** embedded in the character's exported JSON.

## PDF Contract

The PDF output must match the reference contract from the `example/` folder. Treat that folder as the source for layout, visual structure, expected fields, and export behavior.

When changing the form, preview, or export pipeline, verify that:

- Form values appear in the preview.
- Preview values are the values exported to PDF.
- PDF generation still produces the expected document.
- JSON export/import preserves the same data needed to rebuild both the form and preview.

## JSON Contract

JSON export must serialize the current entity state (character, world, etc.).

JSON import must:

- Validate the imported shape before applying it.
- Populate the UI form.
- Populate the UI preview through the same state path as normal editing.
- Avoid partial UI updates where the form and preview disagree.
- Apply defaults for missing optional fields (backward compatibility).

## UI Architecture

Use a clean, straightforward UI architecture:

- Keep domain state, form state, preview rendering, and export services separated.
- Keep components small and focused around a single responsibility.
- Prefer data-driven rendering where practical.
- Put pure export/import logic in services, not inside route components.
- Avoid hidden coupling between form controls and exporters.
- Avoid duplicating entity fields across unrelated state stores.
- Each module (characters, world, combat, etc.) owns its own store, types, services, and components under its own directory.

## Component Policy

Use shadcn base components for UI primitives. Do not hand-roll replacement components when a shadcn component exists.

Expected primitives include buttons, dropdown menus, dialogs, inputs, selects, checkboxes, tabs, cards, separators, labels, and form controls.

Custom components are allowed only as thin composition wrappers around shadcn primitives or as feature-specific containers.

## Styling

Use the colors and CSS variables available in the referenced package CSS. Do not invent a separate color system.

Use Tailwind and existing utility helpers consistently. Keep styling aligned with the package theme tokens and avoid hard-coded one-off colors unless they are already defined by the theme or reference CSS.

## Project Assumptions

Pure client-side React + TypeScript SPA. No backend unless the user explicitly changes the project scope.

All state must be serializable so JSON export/import works consistently across all entity types.

## CLI Output

Before running a new command, wait for the previous command's output. If commands are run, read the full output and confirm success before proceeding.

Do not run multiple commands in parallel. Do not spam similar commands.

## Deployment and VPS access

Read `docs/deployment.md` before working on infrastructure.

- Connect as `deploy` through `contabo-apps` with `-o BatchMode=yes`.
- Docker is available to `deploy` without `sudo`; treat this access as
  administrative and use it only for the documented application operations.
- Use the existing GitHub-hosted Production workflow; do not build images,
  run development services, or install a GitHub runner on the VPS.
- Do not modify SSH, firewall, or other applications without explicit
  authorization. Never expose or store credentials.
- Keep operational detail in `docs/deployment.md`; obtain the user's explicit
  approval before updating it, even after verified infrastructure changes.

### Deployment quality gates

- Production changes must be reproducible through the repository's Production
  workflow. Do not substitute manual VPS configuration changes for a release;
  obtain explicit approval before a manual intervention.
- When a release is requested, commit and push the intended changes, identify
  the Production run for that exact commit SHA, and wait for its terminal
  result. A successful local check, push, image build, or manual fix is not a
  successful deployment.
- Require every required workflow job, including the VPS deployment, to
  succeed. If a job fails, is cancelled, or cannot be observed to completion,
  report the failure or unconfirmed status; do not claim completion.
- After workflow success, verify the running application images match the
  intended SHA, container health is good, and the changed behavior works from
  outside the VPS. For HTTPS changes, check trusted TLS, canonical redirects
  with path/query preservation, application/API routing, HTTP ACME access,
  and renewal/reload behavior.
- If verification requires another configuration fix, make it in the
  repository and repeat the deployment gates. Do not repair production
  manually and present the workflow as having delivered the working result.
- Clearly distinguish manual observations, local test results, and behavior
  verified after the exact CI/CD release. Report the commit and workflow URL
  as release evidence.
- Ask for the user's explicit approval before editing `docs/deployment.md`
  or recording deployment results in other operational documentation.
  A deployment request alone is not documentation approval. Even with
  approval, record a result as deployment-verified only after the workflow
  and post-deployment checks have passed; label manual checks separately.
- Never modify or clear browser data as part of deployment or an origin
  migration. Obtain confirmation that required data was exported or transfer
  is unnecessary before enforcing a redirect that removes old-origin UI
  access.

### Deployment transition guarantees

- Treat deployment as a transition between working service compositions; retain
  the previous Compose configuration and image manifest until external
  verification succeeds.
- Validate workflow YAML, Compose, scripts, and image availability before
  changing running services. Pull all required images first; use bounded
  retries for transient registry failures.
- Use health-gated dependencies for startup order, but do not make serving the
  SPA depend on API availability. A rollback must restore the prior service
  composition without `down` or volume deletion.
- Keep database migrations backward-compatible with the previous backend.
  Application rollback never rolls back the database schema.
- Serialize production changes with both workflow concurrency and the VPS
  operation lock. Mark a release successful only after an external HTTPS/API
  check confirms the intended path.

## Skills

The following agent skills are available under `.github/skills/`. Load the relevant SKILL.md before starting a task that falls in that domain.

| Skill | Path | When to use |
|---|---|---|
| **swade-mastery** | `.github/skills/swade-mastery/SKILL.md` | Any task that requires accurate SWADE rules knowledge: character creation math, combat mechanics, edges/hindrances/powers logic, size system, etc. |
| **shadcn** | `.github/skills/shadcn/SKILL.md` | Adding, auditing, or styling shadcn/ui components; running `npx shadcn@latest add`; working with `components.json` or component registries. |
| **localization** | `.github/skills/localization/SKILL.md` | Adding or extending i18n (i18next / react-i18next): locale namespaces, typed keys, locale selector, migrating hardcoded strings. |
| **tauri-installer-setup** | `.github/skills/tauri-installer-setup/SKILL.md` | Setting up a Tauri v1 desktop build, MSI packaging, or proxy bundling for this app. |
