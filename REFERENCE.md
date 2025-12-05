# Project Reference Documentation

This document provides a technical reference for the codebase, including architecture, data models, and API endpoints.

## Architecture Overview

The project is built using **SvelteKit** and follows a standard structure:

- **`src/routes/`**: Contains the application's pages and API endpoints (file-based routing).
- **`src/lib/`**: Contains shared utilities, components, and server-side logic.
  - **`server/`**: Server-only code (database connections, logging, secrets).
  - **`components/`**: Reusable Svelte components.
  - **`utils.ts`**: General utility functions.
- **`static/`**: Static assets served directly.

## Data Models

The application uses the following core data entities (defined in `src/lib/databasetypes.d.ts`):

- **Association**: Represents a student association (e.g., BDE, BDS).
- **List**: A sub-group or campaign list attached to an association.
- **User**: A student or administrator accessing the portal.
- **Role**: Defines permissions and hierarchy within the system.
- **Member**: Links a User to an Association/List with a specific Role.
- **Event**: An event organized by an association.

## API Reference

The API is located at `/api` and includes the following namespaces:

| Endpoint Namespace  | Description                                     |
| ------------------- | ----------------------------------------------- |
| `/api/associations` | Manage associations (CRUD).                     |
| `/api/auth`         | Authentication routes (login, logout, session). |
| `/api/calendar`     | ICS calendar export and event retrieval.        |
| `/api/config`       | Application configuration settings.             |
| `/api/events`       | Event management.                               |
| `/api/image`        | Image upload and retrieval.                     |
| `/api/lists`        | Manage lists (campaigns/sub-groups).            |
| `/api/members`      | Manage association members.                     |
| `/api/roles`        | Role definitions and permissions.               |
| `/api/users`        | User management.                                |

## Key Configuration Files

- **`svelte.config.js`**: SvelteKit configuration (adapters, preprocessors).
- **`vite.config.ts`**: Vite build configuration, including plugins and testing setup.
- **`vitest.config.ts`**: Configuration for the Vitest test runner.
- **`playwright.config.ts`**: Configuration for E2E testing with Playwright.
- **`eslint.config.js`**: Linting rules.

## Testing

- **Unit Tests**: Run via `bun run test` (Vitest). Located in `tests/unit` and alongside components.
- **E2E Tests**: Run via `bun run test:e2e` (Playwright). Located in `tests/e2e`.

## Logging

Server-side logging is handled by `winston` (configured in `src/lib/server/logger.ts`). Logs are output to the console in JSON format in production.
