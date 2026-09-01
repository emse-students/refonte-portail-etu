# Deployment

## Pipeline

Three GitHub Actions workflows:

- **`Run Tests`** (`.github/workflows/test.yml`) - runs on every push to `main`
  and every pull request, and is CALLED by the deploy's dispatch path. Installs
  with `--frozen-lockfile` on a pinned Bun, then `lint`, `lint:svelte`,
  `format:check`, `check`, `test`, `build` - and then **boots what it built**.
  `lint:svelte` builds a Rust binary from a pinned revision, restored from a
  cache keyed on that revision ([tooling](tooling.md)).
- **`Deploy to Server`** (`.github/workflows/deploy.yml`) - runs on a
  self-hosted runner after `Run Tests` succeeds. Builds the app, copies the
  output into `~/portail-etu` (preserving the server `.env`), restarts it with
  pm2 (`ecosystem.config.cjs`), and then asks the app whether it actually
  answers.
- **`Dependabot auto-merge`** (`.github/workflows/dependabot-auto-merge.yml`) -
  merges the dependency updates this repository has evidence about, and
  dispatches the deploy for them. See below.

**A build is not a boot.** `bun run build` proves `svelte-adapter-bun` produced
something; it proves nothing about whether the thing it produced starts. Until
2026-08-31 the only place that was ever checked was the deploy's own
verification - which is real, and which runs _after_ pm2 has already restarted
production with the broken build. That is a report, not a gate. `Run Tests` now
starts `build/index.js` and asks it for a page, so the answer costs a red pull
request instead of an outage. No `.env` is written for it: the app must start
from nothing, which is also what proves its defaults are complete.

## Dependency updates, and the merge that reaches the server

Dependabot opens the pull requests;
`.github/workflows/dependabot-auto-merge.yml` decides which of them this
repository has EVIDENCE about, and `.github/scripts/dependabot-auto-merge.sh` is
the decision itself, shared by both of that workflow's triggers.

**Three things make it converge rather than merely fire.**

- **A full sweep on every push to `main`, not only a `workflow_run` from one
  pull request.** A pull request whose checks completed days ago never receives
  another event, so an event-only automation acts on what it happened to catch
  and on nothing else. The sweep enumerates every open Dependabot pull request,
  so the right state is reached from any starting state.

  **This was an hourly cron until 2026-08-31, and the measurement that demoted
  it was itself wrong.** It said `event=schedule` had produced ZERO runs,
  counted three hours after the cron landed. Counted again on 2026-09-01, all
  four repositories had delivered a scheduled sweep. **A three-hour window is
  not enough to call a trigger dead**, and a mechanism built on the first quiet
  interval anybody looked at is built on nothing. What survives is the shape of
  the delivery, measured over seven days rather than one afternoon: scheduled
  delivery on a public repository is best-effort and **GitHub drops the slots an
  hourly cron misses rather than queueing them**, so the clock is a floor and
  never a mechanism. The sweep stays bound to the workflow this repository runs
  on a push to `main`, and the cron keeps its slot as that floor.

- **A staleness gate narrow enough to be satisfiable.** A green check is
  evidence about the workflow that PRODUCED it, not about the one `main` carries
  today, and an absent check is indistinguishable from an inapplicable one.
  **But asking whether the head is built on current `main` is far wider than
  that**, and until 2026-09-01 it made the queue undrainable: every merge moves
  `main`, so every merge invalidated every remaining pull request at once, and
  the only exit was a rebuild no workflow holding `GITHUB_TOKEN` may perform.
  `PUT /pulls/{n}/update-branch` writes a merge commit authored by
  `github-actions[bot]`, which parks the re-triggered run in `action_required`
  and makes Dependabot refuse the branch for good; and `@dependabot recreate` is
  answered _"Sorry, only users with push access can use that command"_ when the
  caller is `github-actions[bot]`, measured on emse-students/canari#303. A gate
  whose only remedy is unavailable is a stop, not a gate. The question is now
  whether `.github/workflows/` or `.github/scripts/` moved between the branch's
  base and `main` - what decides which jobs run and what each asserts - so one
  sweep merges everything mergeable, and when the gates really did move the
  sweep says so on the pull request instead of pretending to fix it. The
  predicate is in `.github/scripts/lib/gate-moves.sh`, fails closed on a compare
  it cannot read or one the API truncated at 300, and its self-tests run in the
  same workflow run that uses it. The sweep still marks any head Dependabot did
  not write, whoever wrote it: detecting the state rather than its cause is what
  heals a branch already trapped.
- **A dispatch, because a merge made with `GITHUB_TOKEN` raises no `push`
  event.** GitHub's anti-recursion rule means `Run Tests` never ran on those
  merges and `deploy.yml` never saw the `workflow_run` it waits for, so `main`
  drifted from the server silently. `workflow_dispatch` is the documented
  exception, and the sweep issues exactly one for the whole pass.

Merging several in one sweep is safe because the dispatch path now runs a
`verify` job that calls `test.yml` on the MERGED tree, and the deploy job
refuses to run unless it passed - two updates green apart are not evidence that
their combination is green. The original no-gate dispatch survives as the
explicit `skip_ci` input, for the case it was written for: on 2026-08-06 an
Actions outage dropped the push triggers and a manual dispatch was the only way
through. The sweep never sets it.

**The ceiling is what this repository declares itself unable to see**, and it is
currently EMPTY - a measured answer, not an omission. It is never a semver
judgement: a break that stops the tree compiling is caught by `check`, `lint`
and `build`. An entry is a dependency whose failure would be INVISIBLE to that,
and every entry must name the test that retires it, because a refusal nobody can
lift is the queue this whole mechanism exists to avoid. Both candidates measured
on 2026-08-31 were closed by writing the gate instead: `svelte-adapter-bun` by
the boot step above, and `@humanspeak/svelte-markdown` by
`tests/profileBioMarkdown.test.ts`.

## Quality gates catch breakage before it ships

A **pre-push** hook (`.husky/pre-push`) runs the exact same pipeline as CI plus
the production build. The rule: if something would turn CI or the deploy red, it
must fail at push time first. A **pre-commit** hook runs `format:check` and
`lint` over the whole tree. It only measures: `lint-staged` is gone with
Prettier and ESLint, because a hook that rewrites what you are committing hands
you a commit you have not read ([tooling](tooling.md)).

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
