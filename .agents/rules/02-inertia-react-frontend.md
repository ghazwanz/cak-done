# Inertia + React Frontend Rules

This document outlines the strict best practices and frontend conventions for the **Cak Done** project. These rules are enforced by the Laravel Boost standard and focus on the Inertia.js v3 + React + Tailwind CSS stack.

## 1. Core Architecture & Tech Stack
- **Dependencies**: The primary frontend stack is `@inertiajs/react` v3, React v19, and TailwindCSS v4.
- **Inertia Core Concept**: Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). 
- Use `Inertia::render()` for server-side routing instead of Blade views.
- **IMPORTANT**: Activate `inertia-react-development` when working with Inertia client-side patterns.

## 2. Inertia v3 Features & Migrations
- Use all Inertia features from v1, v2, and v3. Check the documentation via `search-docs` before making changes.
- **New v3 Features**:
  - Standalone HTTP requests (`useHttp` hook)
  - Optimistic updates with automatic rollback
  - Layout props (`useLayoutProps` hook)
  - Instant visits
  - Simplified SSR via `@inertiajs/vite` plugin
  - Custom exception handling for error pages
- **Carried over from v2**: Deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- **Deferred Props**: When using deferred props, add an empty state with a pulsing or animated skeleton. Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- **Deprecations & Removals**:
  - `Axios` has been removed. Use the built-in XHR client with interceptors (or install Axios separately if specifically needed).
  - `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
  - Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
  - `router.cancel()` replaced by `router.cancelAll()`.
  - The `future` configuration namespace has been removed (v2 future options are always enabled).

## 3. Frontend Bundling & SSR
- SSR works automatically in Vite dev mode with the `@inertiajs/vite` plugin — no separate Node.js server needed during development.
- If changes aren't reflecting in the UI, or you encounter `Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest`, run `npm run build`, `npm run dev`, or `composer run dev`.
- Ensure unique, descriptive IDs for all interactive elements to support browser testing.

## 4. UI/UX Aesthetics & Design
- **Use Rich Aesthetics**: Designs must be visually stunning at first glance. Use modern web design best practices (vibrant colors, glassmorphism, dynamic animations).
- **Prioritize Visual Excellence**:
  - Avoid generic plain colors. Use curated, harmonious palettes (e.g., tailored HSL colors, sleek dark modes).
  - Use modern typography from Google Fonts (e.g., Inter, Roboto, Outfit).
  - Use smooth gradients and subtle micro-animations for enhanced UX.
- **Dynamic Interactions**: Implement hover effects and interactive states. A dynamic design encourages user interaction.
- **Premium Feel**: Avoid creating "simple minimum viable products". Make the design feel premium and state of the art.
- **No Placeholders**: When an image is needed, generate a working demonstration using image generation tools.
- **SEO Best Practices**: Ensure proper `<title>` tags, meta descriptions, single `<h1>` hierarchy, and semantic HTML5 elements.

## 5. Shadcn UI Components & MCP Server
- **Component Library**: Use Shadcn UI for standard, accessible, and high-quality React components (e.g., buttons, modals, forms, charts, tables).
- **Integration**: Insert these components directly into the React + Inertia frontend.
- **MCP Server**: Always utilize the **shadcn MCP server** tools (e.g., `mcp_shadcn_search_items_in_registries`, `mcp_shadcn_get_add_command_for_items`, `mcp_shadcn_get_item_examples_from_registries`) to discover, install, and view code examples for components before building them from scratch.
- **Audit**: Use `mcp_shadcn_get_audit_checklist` after adding new components to verify implementation.

## 6. Development Workflow
1. Plan and understand the user requirements and inspirations.
2. Build the foundation by modifying `index.css` and creating a core design system with Tailwind utilities.
3. Build focused, reusable components adhering to the predefined design system.
4. Assemble pages using existing layouts and components.
5. Polish with smooth interactions, transitions, and performance optimizations.
