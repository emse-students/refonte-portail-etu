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
verification - which is real, and which runs _after_ the container has already
restarted production with the broken build. That is a report, not a gate. `CI`
now starts `build/index.js` and asks it for a page, so the answer costs a red
pull request instead of an outage. No `.env` is written for it: the app must
start from nothing, which is also what proves its defaults are complete.

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

## The Bun version is pinned, and that is not arbitrary

`.bun-version` is the single source of truth. `package.json` repeats it in
`packageManager` and `engines.bun` so a human and a tool see the same number;
every workflow using `setup-bun` reads the file via `bun-version-file`, and the
`Dockerfile`'s `FROM oven/bun:<version>` repeats the same number by hand, since
a Docker base image tag can't read a file in the build context. Change the pin
in one place, and remember to change it in that second place too.

### 2026-08 to 2026-09: pinned to 1.3.8, because the host had no AVX2

For about a month the pin was held at 1.3.8 by a property of the deploy host,
not of Bun: it was a KVM guest whose CPU **did not advertise AVX2 - or AVX at
all**. Bun 1.3.9 through at least 1.3.14 crash on a CPU like that: `bun
--version` answers instantly, `bun install` succeeds, `bun run build` succeeds
too (because `bun run` honours a bin's node shebang, so Vite actually ran under
Node) - and then the real runtime, launched (then) by pm2 as
`bun ./build/index.js`, either spun at 100% CPU inside its module load with no
log line and no bound port, or - reproduced directly on the host on 2026-09-22 -
printed `CPU lacks AVX support`, ballooned to 16 GB RSS over 46 seconds, and
segfaulted. Every check that only looked at Bun's own CLI passed; only the
actual bundled server running proved otherwise. A CD run bisected it on the
host itself in August: 1.3.14 through 1.3.9 all fail, **1.3.8 reaches user
code**.

`oven/bun`'s Docker images resolve the `x64-baseline` build unconditionally on
amd64 - not by detecting the host, but because that's the only x64 build the
image ever ships - so the container got the right binary without a detection
script of its own. That half of the reasoning is permanent and has nothing to
do with the version number: baseline is the safe default on any x64 host
regardless of what it advertises.

### 2026-09-22: the host's CPU was changed, and 1.4.2 was re-verified from scratch

The KVM host's CPU model was changed to one that advertises real `avx`/`avx2`
(confirmed via `lscpu`/`/proc/cpuinfo`). Since the original failure was tied to
the missing instruction set rather than to Bun's code, that's a testable claim,
not an assumption to take on faith: the actual production build (extracted from
the running container, not a synthetic script) was booted under `oven/bun:1.4.2`
directly on the host - clean boot, immediate `Listening on ...` log line,
`HTTP 200`, ~1% CPU, ~15 MB RSS. The pin moved to 1.4.2 on that evidence.

**A version string is still never enough on this host by itself** - only user
code running proves a runtime works, which is why this was re-verified against
the real build rather than `bun --version` or `bun install`. Since the move to
Docker, the standing proof of that on every deploy is `deploy.yml`'s "Verify
the app actually answers" step, which asks the just-started container for a
page rather than trusting that `docker compose up` reported success.

**The Dependabot lockfile concern was checked, not just remembered.** Bun 1.4.0
introduced `lockfileVersion: 2`, which Bun 1.3.x (Dependabot's bundled version)
cannot parse - `UnknownLockfileVersion` - which would silently stop every
dependency PR in this repo if `bun.lock` ever got rewritten to v2. Before
adopting 1.4.2 this was tested directly: `bun install --frozen-lockfile` under
1.4.2 against this repo's existing v1 `bun.lock` leaves it at
`lockfileVersion: 1` - the flag that every install in this repo already uses
(CI, the Docker build, the deploy runner) does not upgrade the format. The
residual risk is unchanged from before and unrelated to this pin: a human
running a plain `bun install` (no `--frozen-lockfile`) with a newer local Bun
and committing the result could still write v2, exactly as it could have with
any previous version.

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

Today these live in a `.env` on the deploy server, rewritten by the deploy step
on every release and loaded into the container at start via `env_file:` in
`docker-compose.yml` - the image itself is built and could be pushed anywhere
without ever containing a secret.

`ORIGIN` and `BODY_SIZE_LIMIT` are not secrets and don't come from GitHub
Secrets; they're set directly in `docker-compose.yml`'s `environment:` block
(formerly `ecosystem.config.cjs`'s `env`).

## Planned: fully secret-driven CD (see backlog)

The current setup still depends on a hand-maintained server `.env`. The target
is a fully reproducible deploy where every secret is injected from GitHub
Actions secrets, so a clone can be brought up on a new machine with no manual
server edits. This will be done together with a key rotation. Until then, keep
`GALLERY_API_KEY` (and the others above) in the server `.env`.
