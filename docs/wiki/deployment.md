# Deployment

## Pipeline

Four workflows with a row of their own in the Actions list, and two libraries
nothing triggers directly:

- **`CI`** (`.github/workflows/ci.yml`) - runs on every pull request and on
  every push to `main`. Installs with `--frozen-lockfile` on a pinned Bun, then
  `lint`, `lint:svelte`, `format:check`, `check`, `test`, `build` - and then
  **boots what it built**. Ends in `CI passed`, the one check the ruleset
  requires and the one the release gate reads.
- **`Release`** (`.github/workflows/release.yml`) - **the only thing that
  deploys**. Three gates, then `deploy.yml` and the packaged archive.
- **`Arm auto-merge`** (`.github/workflows/arm-auto-merge.yml`) - asks GitHub to
  squash-merge every pull request the moment `CI passed` goes green.
- **`Scheduled`** (`.github/workflows/scheduled.yml`) - everything on a clock,
  plus the dispatch-only egress probe.

Two files have no trigger of their own and no row in the Actions list:
`code-analysis.yml` (called by the two above) and `deploy.yml` (called by the
release).

## Nothing deploys on a push - the release does

**Since 2026-09-04, and in every repository of the ecosystem** (user: _"Pour tous
les repos, le push sur main ne doit rien deployer, c'est la release qui le
fait."_). `deploy.yml` used to fire on `workflow_run` after `Run Tests` finished
on `main`, so every merge was a deployment: production was whatever the last
green pull request happened to be, and nobody chose it. The human gesture that
ships is now publishing a GitHub release:

```sh
gh release create v1.2.3 --generate-notes
```

`release.yml` asks three questions, all of them in
`.github/scripts/release-preflight.sh` so they can be tested without a run - and
they are, on both sides of every gate:

1. **Is the version a version?**
2. **Is the released commit on `main`?**
3. **Did `CI passed` go green ON that commit?** Not "run the tests again". The
   `verify` job did exactly that, and a second run is a second opinion about the
   same tree - the one that ships. **An absent check is refused too**: that is
   not a failure, it means nothing ever asked, and an absent measurement is not
   permission.

`skip_ci` went with `verify`. It was the escape hatch for the 2026-08-06 Actions
outage that dropped the push triggers; the release path has no push trigger to
lose, and a flag that skips the only evidence a deploy has is a fallback path -
reaching one means the primary path failed, and the fix belongs there.

**So a merged fix is not a shipped fix**, and that is the deliberate cost.

**A build is not a boot.** `bun run build` proves `svelte-adapter-bun` produced
something; it proves nothing about whether the thing it produced starts. Until
2026-08-31 the only place that was ever checked was the deploy's own
verification - which is real, and which runs _after_ pm2 has already restarted
production with the broken build. That is a report, not a gate. `CI` now
starts `build/index.js` and asks it for a page, so the answer costs a red pull
request instead of an outage. No `.env` is written for it: the app must start
from nothing, which is also what proves its defaults are complete.

## Dependency updates, and the merge that reaches the server

Dependabot opens the pull requests (`.github/dependabot.yml`); **from there they
are the same as anybody's**. `arm-auto-merge.yml` arms GitHub's own auto-merge
on every pull request in the repository, and GitHub squash-merges each one the
moment `CI passed` goes green.

**There is no sweep any more (deleted 2026-09-04).**
`dependabot-auto-merge.yml` was ~450 lines plus a shell library: it enumerated
the open Dependabot pull requests, decided for ITSELF whether each was green,
merged them with its own `gh pr merge`, and dispatched the deploy afterwards.
Four mechanisms where one belongs. The reason it existed at all was real - a
`pull_request` run raised by Dependabot **gets no secrets**, GitHub runs it as
if it came from a fork, so no App token can be minted in that context, and an
arming made with `GITHUB_TOKEN` produces a merge that raises no `push` event.
**`pull_request_target` runs in the base repository's context, WITH its secrets,
for every pull request**, which is what makes one file enough. It is safe on
that trigger for one specific reason: **it never checks the pull request out.**

**What went with the sweep that DID NOT work.** Its staleness gate refused to
merge a head whose check suite described gates `main` no longer carried, and the
only way to lift that refusal was to rebuild the branch - which no identity a
workflow can mint may do. `PUT /pulls/{n}/update-branch` writes a merge commit
authored by `github-actions[bot]`, which parks the re-triggered run in
`action_required` and makes Dependabot refuse the branch for good; and
`@dependabot recreate` is answered _"Sorry, only users with push access can use
that command"_ - **including when the caller is a GitHub App**, measured ten
times out of ten on emse-students/canari. An App INSTALLATION is not an account
with push access. _A gate whose only remedy is unavailable is a stop, not a
gate._

**And the merge no longer reaches the server, which is the point.** Auto-merge merges as whoever
ARMED it, and the arming is done with an App token, so the squash lands as a real `push` to `main`
and `CI` runs on it - which is what the release gate reads. What it does NOT do any more is deploy:
that is `release.yml`'s job alone. A dependency update therefore merges itself and then waits for
somebody to decide this is the tree that ships.

**The ceiling is what this repository declares itself unable to see**, and it is
currently EMPTY - a measured answer, not an omission. It is never a semver
judgement: a break that stops the tree compiling is caught by `check`, `lint`
and `build`. An entry is a dependency whose failure would be INVISIBLE to that,
and every entry must name the test that retires it, because a refusal nobody can
lift is the queue this whole mechanism exists to avoid. Both candidates measured
on 2026-08-31 were closed by writing the gate instead: `svelte-adapter-bun` by
the boot step above, and `@humanspeak/svelte-markdown` by
`tests/profileBioMarkdown.test.ts`.

### The security pass can now block a merge

`code-analysis.yml` is a `workflow_call` library with no triggers of its own.
CodeQL, the TruffleHog secret scan and the vulnerability audit ran on every pull
request and **could not block one**, because nothing required them - _a red tick
nothing enforces is worse than no tick, because it looks enforced_, and this
repository is PUBLIC and carried the largest advisory debt of the five. `ci.yml`
calls it as its `security` job and aggregates everything into `CI passed`;
`scheduled.yml` calls the same file nightly, which is the half a pull request
cannot see: a new advisory landing against code nobody touched.

**An npm outage is not a vulnerability.** `bun audit` exits 1 for
`POST .../advisories/bulk - 503` exactly as it exits 1 for a real advisory, so
`.github/scripts/audit-dependencies.sh` classifies once and answers with three
exit codes - `0` clean, `1` an advisory was named, `2` the registry never
answered. What a `2` costs is the caller's policy: a pull request tolerates it
(a refusal whose only remedy is unavailable is a stop, not a gate), the nightly
pass fails on it (nothing is queued behind that run, and its failure is the
report saying this tree has gone a day unaudited). The unknown case fails
CLOSED, and `audit-dependencies.test.sh` asserts that direction against a fake
`bun`, in the same run that uses the script.

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
