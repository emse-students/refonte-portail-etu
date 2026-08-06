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
| `/api/public/carte`                   | The published Carte de la Vie Asso |
| `/api/media/public/:id`               | A public logo blob                 |

`PUBLIC_CANARI_URL` overrides the base URL (defaults to `https://canari-emse.fr`).

## The Carte de la Vie Asso

Canari's poster editor can put one map **online**; the directory renders it above
the association tiles, every blob a link to that association's page. Component:
[`src/lib/components/CarteVieAsso.svelte`](../../src/lib/components/CarteVieAsso.svelte).
Canari's own half is documented in its wiki under `docs/wiki/carte-vie-asso.md`.

**The payload is a resolved poster, and this renderer decides nothing.** Canari
computes every box and every font size the printed poster draws - the bureau
crown ellipse, the length-based name shrinking, the widening of a card whose name
holds an unbreakable word - and publishes them. Anything decided here would be an approximation of a
hand-composed print, which is exactly what an earlier version of this component
was. Four properties follow from that:

- **Every number is in POSTER pixels**, against `carte.stage`, plus an
  `aspectRatio` the frame must honour or the map skews. The renderer draws a
  `stage.w x stage.h` box and scales it **once** (`transform: scale(k)`,
  `k = frameWidth / stage.w`), so published numbers are used verbatim. That also
  makes the directory's shrink-to-fit agree with Canari's editor: a CSS transform
  does not change `clientHeight`, so both loops measure the same pixels.
- **Association content is joined live.** A unit carries `assoId`; the name, logo,
  brand color and contact email come from the association list the page already
  loads, so a rename or a new logo reaches the live map with no republish. A unit
  whose association no longer resolves is dropped - a live map cannot produce a
  dead link.
- **People are a snapshot.** Which member sits in which crown slot is an authoring
  decision in Canari, so member names, roles and initials travel in the payload. A
  roster change needs a republish. Only `userId` travels for the photo; the face
  itself comes from this repo's own `/api/users/:id/avatar` proxy.
- **A member card is sized by its name, so BOTH its dimensions travel.** Canari
  shrinks the name to fit the card and, past a readable floor, widens the card
  instead - so `w` varies from card to card. Its `photo` is published separately
  and must never be derived from `w`: a widened card keeps the same face size as
  its neighbours, otherwise the one member with a long surname gets a bigger photo.
- **Appearance is resolved.** Silhouettes arrive as CSS `border-radius` values and
  the palette as a `style` block, so this repo holds no copy of Canari's catalogs
  or theme. Canari validates both before serving: a radius outside `[0-9%./ ]`
  becomes a circle and a color outside hex/`rgb()`/`hsl()` a neutral grey, rather
  than being escaped, because these land in `style` attributes here.

Two things are mirrored rather than published, and both are noted in the
component: the member card's **chrome** (padding, corner radii, shadows) which is
cosmetic and static, and Canari's **two font families**, which
are self-hosted here at the same versions (`@fontsource-variable/nunito` and
`/fredoka`, imported in `app.css` and used by nothing else). Text set in another
family measures differently, so the fonts are part of the fidelity, not decoration.

Two deliberate behaviours: the map is **wide screens only** (`hidden lg:block`),
because it is a dense hand-made composition with no reflow and the tiles already
serve narrow viewports; and it is hidden while a search is running, since it
shows every association regardless of the query.

A 404 from `/api/public/carte` means _nothing is published_ - the normal case,
not a failure - so `getPublishedCarte` returns null for it and still throws on
any other status. It also **gates the schema version**: a v1 publication (frames
fractions, a `bubbles` array, no members) is not renderable as the poster, so the
map is omitted and the reason logged - the poster still exists in Canari, and one
republish from its editor is the whole fix. The load fetches the carte and the
association list independently, so neither can take the other down.

## Avatars: same-origin MiGallery proxy

Member faces come from MiGallery, which requires a server-side API key. The
browser requests `/api/users/:id/avatar` (same origin); the SvelteKit endpoint
[`src/routes/api/users/[userId]/avatar/+server.ts`](../../src/routes/api/users/%5BuserId%5D/avatar/+server.ts)
fetches `${GALLERY_API_URL}/users/:id/avatar` with `GALLERY_API_KEY` and streams
the image back. The `userId` is the Authentik uid carried by the public API,
which is the same identifier MiGallery keys avatars by. On any miss the endpoint
returns 404 and the UI falls back to generated initials - `MemberCard` swaps to
initials on the image's `onerror`, so **any** failing status degrades, not only a 404.

This is same-origin on purpose: unlike the public API, MiGallery lives on a
separate host the deploy server _can_ reach, so proxying avoids exposing the key
to the browser and avoids cross-site requests.

### The cache, and what may be remembered

Answers are cached in process by
[`src/lib/server/avatarCache.ts`](../../src/lib/server/avatarCache.ts) - one hour
for an image, ten minutes for an absence, capped at 500 entries. `X-Cache:
hit|miss` on the response makes it verifiable with a single request, which matters
because the deploy host has no SSH access.

It exists for a measured reason. Without it, one association page of N members
opened N connections to MiGallery **per visitor, per visit**. On 2026-08-06 the
host briefly could not open outbound connections at all, and that amplification
turned a single network fault into 479 recorded HTTP 502s in tight bursts - all of
them the same bun error, `Unable to connect`, on a well-formed URL. Neither DNS,
TLS nor the secrets were involved; the cache does not fix the network, it removes
the redundant work that made one hiccup visible on every card.

Hence the statuses, which must not be collapsed into each other:

| Situation                              | Status | `Cache-Control`         | Cached in process |
| -------------------------------------- | ------ | ----------------------- | ----------------- |
| Image found                            | 200    | `public, max-age=86400` | yes, 1 h          |
| Upstream 404: this user has no avatar  | 404    | `public, max-age=600`   | yes, 10 min       |
| Upstream 401 / 429 / 5xx               | 404    | `no-store`              | **never**         |
| Upstream unreachable (the fetch threw) | 502    | `no-store`              | **never**         |

**Only an answer about the avatar may be remembered**, and exactly one status
qualifies (`isCacheableAbsence`). `!res.ok` reads like "no avatar" and is not: a
rotated `GALLERY_API_KEY` or one MiGallery 5xx, stored as an absence, would be
remembered as "these members have no face" for the whole TTL, for every visitor.
Likewise a transport failure stays a 502 - dressing it as a 404 or caching it would
make a passing outage stick and erase the only signal this host emits.

That signal is the route's `console.error`, and pm2 now stamps it with a time
(`time: true` in `ecosystem.config.cjs`). Without that stamp the 479 failures above
could not be placed in time at all, which is what made the diagnosis cost a whole
session: the count alone reads as a chronic fault, while their position in the
append-only log showed one burst-shaped episode.

## Frontend structure

- **Design system**: TailwindCSS with a `mines-*` palette and glassmorphism
  utilities (see [`tailwind.config.js`](../../tailwind.config.js) and
  [`src/app.css`](../../src/app.css)), light and dark themes.
- **Animation**: a lightweight `reveal` action
  ([`src/lib/actions/reveal.ts`](../../src/lib/actions/reveal.ts)) fades content
  in on scroll via IntersectionObserver, fully disabled under
  `prefers-reduced-motion`.
- **Components**: `AssociationCard`, `AssociationLogo`, `CarteVieAsso`,
  `EntityDetail`, `MemberCard`, `FeaturedLinks`, `GlassCard`, `Button`,
  `ThemeToggle`.
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
