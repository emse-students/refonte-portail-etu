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

Reproducibility: the Bun version is pinned and installs use
`--frozen-lockfile`, so CI, the deploy runner and a fresh clone all resolve the
same toolchain and dependency tree. The `bun.lock` is committed.

## The Bun version is pinned to 1.3.8, and that is not arbitrary

`.bun-version` is the single source of truth. `package.json` repeats it in
`packageManager` and `engines.bun` so a human and a tool see the same number;
every workflow using `setup-bun` reads the file via `bun-version-file`, and
`deploy.yml` reads it too. Change the pin in one place or not at all.

Two independent properties of the deploy host set it:

- **No AVX2.** The box is a KVM guest whose CPU does not advertise it, and
  Bun's ordinary `linux-x64` build requires it. `setup-bun` only ever fetches
  that build, so `deploy.yml` downloads `bun-linux-x64-baseline` by name rather
  than trusting a detection script - which build sits on that machine is far too
  load-bearing to be inferred.
- **Bun's runtime cannot start there from 1.3.9 onward.** This one cost hours of
  downtime on 2026-08-26. The failure mode is the reason: `bun --version` answers
  instantly, `bun install` succeeds, and `bun run build` succeeds _too_ - because
  `bun run` honours a bin's node shebang, so Vite actually ran under Node. Every
  check that looked at Bun passed. Only the server itself, launched by pm2 as
  `bun ./build/index.js`, spun at 100% CPU inside its module load - before its
  first log line, before it bound a port. A CD run bisected it on the host
  itself: 1.3.14 through 1.3.9 all hang, **1.3.8 reaches user code**.

So the install step is not finished when the binary answers `--version`. It runs
a one-line `bun -e` that writes a marker file and fails the deploy if the marker
is absent. A version string proves a binary loads; only user code running proves
a runtime works.

**This also keeps Dependabot alive.** Bun 1.4.0 writes `lockfileVersion: 2`, and
Bun 1.3.x cannot parse it - `UnknownLockfileVersion`. Dependabot's bundled Bun is
1.3.x, so a v2 lockfile silently stops every dependency PR in this repo. At 1.3.8
the lockfile stays at version 1 and Dependabot keeps working. Any future move
past 1.4.0 has to answer that question first.

The general rule this leaves: **a repo moved to the Bun runtime must be verified
on its target host, not only in CI.** CI runs on a different machine, and here
the difference was one CPU feature flag.

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
