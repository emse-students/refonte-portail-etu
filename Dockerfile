# 1.3.8 is pinned here for the same reason it is pinned in `.bun-version`: on the
# production host (a KVM guest with no AVX2) Bun's runtime cannot reach user code
# from 1.3.9 onward - it spins at 100% CPU during module load, before its first
# log line and before it binds a port, while `--version` and `bun install` both
# still succeed. See docs/wiki/deployment.md. oven/bun's images always resolve the
# x64-baseline build regardless of tag, which is the other half of that pin.
FROM oven/bun:1.3.8 AS build
WORKDIR /app

# The whole tree is needed before `bun install`, not just the lockfile: `prepare`
# runs `paraglide:compile` (reads ./messages and ./project.inlang), and skipping
# straight to a lockfile-only layer would run it against a source tree that isn't
# there yet.
COPY . .
RUN bun install --frozen-lockfile
RUN bunx svelte-kit sync && bun run build

FROM oven/bun:1.3.8-slim AS runtime
WORKDIR /home/bun/app

# svelte-adapter-bun's output is self-contained (everything is bundled at build
# time - see package.json, which has no runtime `dependencies`), so the image
# only needs the build output and the Bun binary, never node_modules.
COPY --from=build --chown=bun:bun /app/build ./build

USER bun
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "./build/index.js"]
