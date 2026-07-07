# Architecture

## Overview

The portal is a thin, read-only view over Canari. It holds no data of its own:

```
Browser ──► Portail (SvelteKit, adapter-bun)
   │
   ├──► GET https://canari-emse.fr/api/public/*      (associations, lists, members)
   ├──► GET https://canari-emse.fr/api/media/public/* (logos)
   └──► GET /api/users/:id/avatar ──► MiGallery       (member faces, server-proxied)
```

## Client-side rendering

Pages set `export const ssr = false` (see [`src/routes/+layout.ts`](../../src/routes/+layout.ts)).
The deploy host cannot reach `canari-emse.fr` from the server (hairpin NAT: the
portal and Canari sit behind the same public IP), so server-side `fetch` to the
public API fails. Rendering in the browser sidesteps this: the visitor's browser
reaches Canari directly. Page loaders are resilient - on API failure they return
empty data with a `failed` flag rather than throwing, so the static shell always
renders.

## Data source: Canari public API

All content is read from Canari's unauthenticated read-only API. The typed
client lives in [`src/lib/canari.ts`](../../src/lib/canari.ts); response shapes
are in [`src/lib/types.ts`](../../src/lib/types.ts).

| Endpoint                              | Returns                            |
| ------------------------------------- | ---------------------------------- |
| `/api/public/associations?type=…`     | Associations or campaign lists     |
| `/api/public/associations/slug/:slug` | One entity with its public members |
| `/api/media/public/:id`               | A public logo blob                 |

`PUBLIC_CANARI_URL` overrides the base URL (defaults to `https://canari-emse.fr`).

## Avatars: same-origin MiGallery proxy

Member faces come from MiGallery, which requires a server-side API key. The
browser requests `/api/users/:id/avatar` (same origin); the SvelteKit endpoint
[`src/routes/api/users/[userId]/avatar/+server.ts`](../../src/routes/api/users/%5BuserId%5D/avatar/+server.ts)
fetches `${GALLERY_API_URL}/users/:id/avatar` with `GALLERY_API_KEY` and streams
the image back. The `userId` is the Authentik uid carried by the public API,
which is the same identifier MiGallery keys avatars by. On any miss the endpoint
returns 404 and the UI falls back to generated initials.

This is same-origin on purpose: unlike the public API, MiGallery lives on a
separate host the deploy server _can_ reach, so proxying avoids exposing the key
to the browser and avoids cross-site requests.

## Frontend structure

- **Design system**: TailwindCSS with a `mines-*` palette and glassmorphism
  utilities (see [`tailwind.config.js`](../../tailwind.config.js) and
  [`src/app.css`](../../src/app.css)), light and dark themes.
- **Animation**: a lightweight `reveal` action
  ([`src/lib/actions/reveal.ts`](../../src/lib/actions/reveal.ts)) fades content
  in on scroll via IntersectionObserver, fully disabled under
  `prefers-reduced-motion`.
- **Components**: `AssociationCard`, `AssociationLogo`, `EntityDetail`,
  `MemberCard`, `FeaturedLinks`, `GlassCard`, `Button`, `ThemeToggle`.
- **Brand**: names centralised in [`src/lib/site.ts`](../../src/lib/site.ts).
- **Helpers**: logo/avatar URLs, initials and deterministic colors in
  [`src/lib/media.ts`](../../src/lib/media.ts).

## Routes

| Route                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `/`                      | Landing: hero, ecosystem links, preview   |
| `/associations`          | All associations (searchable)             |
| `/associations/[handle]` | One association with members              |
| `/lists`                 | Campaign lists, grouped by promotion year |
| `/lists/[handle]`        | One campaign list with members            |
| `/liens`                 | Ecosystem links                           |
