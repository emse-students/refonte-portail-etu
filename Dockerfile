# Pinned to the same version as `.bun-version`, for the same reason: reproducible
# builds across CI, deploy and this image. Bun was held at 1.3.8 for months because
# 1.3.9+ crashed on the production host - a KVM guest whose CPU lacked AVX, which
# some Bun codegen path silently required. That was a hardware property, not a Bun
# bug: once the host's CPU model was changed to one with AVX/AVX2, 1.4.2 was
# re-verified to boot the actual production build cleanly. See docs/wiki/deployment.md.
FROM oven/bun:1.4.2 AS build
WORKDIR /app

# The whole tree is needed before `bun install`, not just the lockfile: `prepare`
# runs `paraglide:compile` (reads ./messages and ./project.inlang), and skipping
# straight to a lockfile-only layer would run it against a source tree that isn't
# there yet.
COPY . .
RUN bun install --frozen-lockfile
RUN bunx svelte-kit sync && bun run build

FROM oven/bun:1.4.2-slim AS runtime
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
