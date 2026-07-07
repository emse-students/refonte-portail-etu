# Portail Étudiant ICM

The open, read-only **showcase** (vitrine) of student associative life at the
École des Mines de Saint-Étienne. It is the public face of
[Canari](https://canari-emse.fr): it lists associations and campaign lists with
their members, and points visitors to the wider student ecosystem (Canari,
MiGallery, Sky, Le Cercle).

There is no login and no editing here. All data comes from Canari's public
read-only API; associations, lists and members are managed inside Canari.

## How it works

- **Frontend**: SvelteKit 5 (Svelte runes) + TailwindCSS, served by
  `svelte-adapter-bun`.
- **Client-rendered**: pages render in the browser (`ssr = false`) because the
  deploy host cannot reach `canari-emse.fr` server-side; the browser fetches the
  public API directly.
- **Data source**: Canari's public API at `${PUBLIC_CANARI_URL}/api/public/*`
  (associations, lists, members). Logos are public media blobs on the same host.
- **Avatars**: member faces are proxied same-origin through
  `/api/users/:id/avatar`, which fetches MiGallery with a server-side key.

See [`docs/wiki/`](docs/wiki/index.md) for the full technical documentation.

## Quick start

```bash
bun install
cp .env.example .env    # then fill in the values (see below)
bun run dev             # http://localhost:5173
```

## Environment variables

| Variable            | Required | Purpose                                                                           |
| ------------------- | -------- | --------------------------------------------------------------------------------- |
| `PUBLIC_CANARI_URL` | no       | Base URL of the Canari instance. Defaults to `https://canari-emse.fr`.            |
| `GALLERY_API_URL`   | yes\*    | MiGallery base URL. Avatar endpoint is `${GALLERY_API_URL}/users/:id/avatar`.     |
| `GALLERY_API_KEY`   | yes\*    | Server-side MiGallery API key for the avatar proxy. Never exposed to the browser. |
| `PORTAL_URL`        | no       | `Origin` header sent to MiGallery, if it enforces one.                            |

\* Required only for member avatars; without them the UI falls back to generated
initials.

## Scripts

| Command          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `bun run dev`    | Dev server.                                             |
| `bun run build`  | Production build (adapter-bun).                         |
| `bun run check`  | `svelte-kit sync` + `svelte-check` (0 errors expected). |
| `bun run lint`   | ESLint. `lint:fix` auto-fixes.                          |
| `bun run format` | Prettier write. `format:check` verifies.                |
| `bun run test`   | Vitest.                                                 |

## Quality gates

A **pre-push** hook runs the full pipeline (`lint`, `format:check`, `check`,
`test`, `build`) so a red CI/deploy is caught locally before pushing. The
`Run Tests` workflow runs the same gates on `main` and pull requests. Installs
are pinned (`bun install --frozen-lockfile`, Bun 1.3.14) for reproducibility.

## License

Distributed under the [PolyForm Noncommercial License 1.0.0](LICENSE), the same
license as the rest of the ecosystem. Please keep the `Required Notice:` line
from the [`LICENSE`](LICENSE) file (contributors + repository link).
