# Repository Guidelines

## Project Structure & Module Organization

- `src/routes/`: primary UI screens using Svelte Kit routing (e.g., `+page.svelte` implements the task strip board).
- `src/lib/`: shared utilities and assets; `index.ts` exports reusable helpers and `assets/` stores icons like `favicon.svg`.
- `static/`: files served verbatim at the web root; place publicly cached assets here.
- `vitest-setup-client.ts`: global testing setup; extend here for cross-test utilities or mocks.

## Build, Test, and Development Commands

- `pnpm dev`: start the Vite development server with hot module replacement.
- `pnpm build`: create a production build in `.svelte-kit/output`.
- `pnpm preview`: serve the production build locally for smoke testing.
- `pnpm check`: run Svelte type checks via `svelte-check`.
- `pnpm lint`: ensure Prettier formatting and ESLint rules pass.
- `pnpm format`: apply Prettier across the workspace.
- `pnpm test` / `pnpm test:unit`: execute Vitest suites; append `--watch` for TDD loops.

## Coding Style & Naming Conventions

- Language: Svelte 5 with TypeScript; prefer explicit types over inference when exporting APIs.
- Styling: Prettier enforces 2-space indentation and semicolon-free Svelte conventions; run `pnpm format` before pushing.
- Components: use PascalCase filenames (`TaskStrip.svelte`), colocate styles in component files, and keep shared logic in `src/lib/`.
- TailwindCSS is available; prefer utility classes for layout before adding custom CSS in `app.css`.

## Testing Guidelines

- Framework: Vitest with Svelte testing utilities; add UI specs as `*.test.ts` near the feature or inside `src/routes/__tests__/`.
- Initializers live in `vitest-setup-client.ts`; register shared mocks or user events there.
- Tests should cover drag-and-drop flows, localStorage persistence, and task CRUD paths before shipping changes.
- Run `pnpm test -- --run` in CI; use `--coverage` locally when touching critical logic.
