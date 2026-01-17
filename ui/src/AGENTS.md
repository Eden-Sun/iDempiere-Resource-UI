# src - Vue 3 Application Source

## Purpose
Root source directory for the iDempiere Resource UI - a clinic appointment management frontend built with Vue 3 + TypeScript + daisyUI, connecting to iDempiere ERP REST API.

## Key Files
- `main.ts` - Vue app entry point, router and app initialization
- `vite-env.d.ts` - Vite environment type declarations

## Subdirectories
- `app/` - View layer: routes, layout, page components (see app/AGENTS.md)
- `features/` - Domain logic: auth, resource booking, requests, orders (see features/AGENTS.md)
- `composables/` - Reusable Vue composition functions (see composables/AGENTS.md)
- `components/` - Shared UI components (see components/AGENTS.md)
- `shared/` - Cross-cutting utilities: API client, formatters (see shared/AGENTS.md)

## Architecture
```
src/
├── app/           → Presentation layer (views, routes)
├── features/      → Business logic (domain-specific APIs, stores)
├── composables/   → Reusable state/logic abstractions
├── components/    → Reusable UI building blocks
└── shared/        → Infrastructure (HTTP client, utils)
```

## For AI Agents
- **Tech Stack**: Vue 3 Composition API (`<script setup>`), TypeScript, daisyUI (Tailwind)
- **Build**: Vite with base path `/emui/`
- **Package Manager**: Use `bun`, not npm
- **API Pattern**: All API calls go through `shared/api/http.ts` using `apiFetch()`
- **State**: Use `useAuth()` from `features/auth/store.ts` for authentication state
- **Styling**: Use daisyUI classes (e.g., `btn btn-primary`, `card`, `modal`)

## Dependencies
- Vue Router for navigation (`app/routes.ts`)
- ky HTTP client wrapped in `apiFetch`
- iDempiere REST API backend (configured via `VITE_API_IP`)

## Development Commands
```bash
bun run dev      # Start dev server at localhost:5173/emui/
bun run build    # Build to ../web-content/
bun run lint     # ESLint check
bunx vue-tsc --noEmit  # TypeScript check
```
