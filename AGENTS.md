# Character Creation App - AI Coding Instructions

## Product Contract

This project has one strict user flow:

1. UI Form -> UI Preview -> dropdown action: Export to PDF -> PDF produced
2. UI Form -> UI Preview -> dropdown action: Export to JSON -> JSON produced
3. UI Form -> UI Preview -> dropdown action: Import from JSON -> UI Form filled and UI Preview filled

Do not build alternate flows unless the user explicitly asks for them. The form is the editable source of truth, the preview is the rendered representation, and exports must reflect the current preview state.

## PDF Contract

The PDF output must match the reference contract from the `example/` folder. Treat that folder as the source for layout, visual structure, expected fields, and export behavior.

When changing the form, preview, or export pipeline, verify that:

- Form values appear in the preview.
- Preview values are the values exported to PDF.
- PDF generation still produces the expected document.
- JSON export/import preserves the same data needed to rebuild both the form and preview.

## JSON Contract

JSON export must serialize the current character state.

JSON import must:

- Validate the imported shape before applying it.
- Populate the UI form.
- Populate the UI preview through the same state path as normal form editing.
- Avoid partial UI updates where the form and preview disagree.

## UI Architecture

Use a clean, straightforward UI architecture:

- Keep domain state, form state, preview rendering, and export services separated.
- Keep components small and focused around a single responsibility.
- Prefer data-driven rendering where practical.
- Put pure export/import logic in services, not inside route components.
- Avoid hidden coupling between form controls and exporters.
- Avoid duplicating character fields across unrelated state stores.

## Component Policy

Use shadcn base components for UI primitives. Do not hand-roll replacement components when a shadcn component exists.

Expected primitives include buttons, dropdown menus, dialogs, inputs, selects, checkboxes, tabs, cards, separators, labels, and form controls.

Custom components are allowed only as thin composition wrappers around shadcn primitives or as feature-specific containers.

## Styling

Use the colors and CSS variables available in the referenced package CSS. Do not invent a separate color system.

Use Tailwind and existing utility helpers consistently. Keep styling aligned with the package theme tokens and avoid hard-coded one-off colors unless they are already defined by the theme or reference CSS.

## Project Assumptions

Pure client-side React + TypeScript SPA. No backend unless the user explicitly changes the project scope.

State should be serializable so JSON export/import and PDF export can use the same character data.

## CLI Output

Before running a new command, wait for the previous command's output. If commands are run, read the full output and confirm success before proceeding.

Do not run multiple commands in parallel. Do not spam similar commands.
