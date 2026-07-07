# Deployment

## Pipeline

Two GitHub Actions workflows:

- **`Run Tests`** (`.github/workflows/test.yml`) - runs on every push to `main`
  and every pull request. Installs with `--frozen-lockfile` on a pinned Bun,
  then `lint`, `format:check`, `check`, `test` and `build`.
- **`Deploy to Server`** (`.github/workflows/deploy.yml`) - runs on a
  self-hosted runner after `Run Tests` succeeds. Builds the app, copies the
  output into `~/portail-etu` (preserving the server `.env`), and restarts it
  with pm2 (`ecosystem.config.cjs`).

## Quality gates catch breakage before it ships

A **pre-push** hook (`.husky/pre-push`) runs the exact same pipeline as CI plus
the production build. The rule: if something would turn CI or the deploy red, it
must fail at push time first. A **pre-commit** hook runs `lint-staged`
(Prettier + ESLint) on staged files.

Reproducibility: the Bun version is pinned (1.3.14) and installs use
`--frozen-lockfile`, so CI, the deploy runner and a fresh clone all resolve the
same toolchain and dependency tree. The `bun.lock` is committed.

## Environment and secrets

Runtime configuration is read via `$env/dynamic/*` (see `.env.example`):

| Variable            | Scope       | Purpose                                    |
| ------------------- | ----------- | ------------------------------------------ |
| `PUBLIC_CANARI_URL` | public      | Canari base URL (browser + server).        |
| `GALLERY_API_URL`   | server-only | MiGallery base URL for the avatar proxy.   |
| `GALLERY_API_KEY`   | server-only | MiGallery API key (never sent to browser). |
| `PORTAL_URL`        | server-only | `Origin` header for MiGallery, if needed.  |

Today these live in a `.env` on the deploy server, which the deploy step
preserves across releases.

## Planned: fully secret-driven CD (see backlog)

The current setup still depends on a hand-maintained server `.env`. The target
is a fully reproducible deploy where every secret is injected from GitHub
Actions secrets, so a clone can be brought up on a new machine with no manual
server edits. This will be done together with a key rotation. Until then, keep
`GALLERY_API_KEY` (and the others above) in the server `.env`.
