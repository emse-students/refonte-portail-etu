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

## Server-side rendering

Pages render on the server and then hydrate (`export const ssr = true`, see
[`src/routes/+layout.ts`](../../src/routes/+layout.ts)). Loaders stay UNIVERSAL
(`+page.ts`, never `+page.server.ts`): the server renders the first view and
SvelteKit serialises the result into the page, so hydration re-fetches nothing,
while a later client-side navigation reaches Canari straight from the visitor's
browser. Loaders are still resilient - the directory pages return empty data
with a `failed` flag rather than throwing - so the shell always renders.

### It was `ssr = false`, and the reason has been refuted

This section used to read: _"the deploy host cannot reach `canari-emse.fr` from
the server (hairpin NAT: the portal and Canari sit behind the same public IP)"_.
Both halves of that were checked on 2026-08-19 and neither holds:

- **The premise.** `canari-emse.fr` resolves to Cloudflare anycast
  (104.21.10.94 / 172.67.162.196); `portail-etu.emse.fr` is 193.49.175.67. They
  do not share a public IP, so a server-side request leaves for Cloudflare rather
  than turning back through the portal's own NAT. There is no hairpin to suffer.
- **The consequence.** Whether the mechanism is gone is a different question from
  whether the reason describes it, so it was measured from the deploy host
  ITSELF, by a dispatch-only workflow kept in the repository
  ([`.github/workflows/probe-egress.yml`](../../.github/workflows/probe-egress.yml)):
  `[canari-public-associations] status=200 bytes=30732 dns=0.018s connect=0.034s
tls=0.063s total=0.122s`. The self-hosted runner is the deploy box, so that is
  exactly what the app gets.

The probe stays in the repo rather than being deleted with the claim it settled:
if server-side egress ever breaks, this is the one command that says so, and it
prints status codes, byte counts and timings only - never a body, a header or an
environment value, because the repository is public.

**What it cost.** With `ssr = false`, `<svelte:head>` never ran on the server, so
every page shipped a head with no title, no description and no preview image -
measured on prod the same day on `/associations/bde`, which returned charset,
icon, viewport, a verification token, a logo preload and two stylesheet links,
and nothing else. That was the entire indexable surface of a site whose whole
purpose is being the public face of the ecosystem. See [SEO](seo.md).

### What turning it on made load-bearing

Two things were harmless in a SPA and are not on a server:

- **Both detail loaders answered 404 for ANY upstream failure.** A visitor
  reloaded; a crawler deindexes. The distinction is now carried as a type
  (`CanariApiError.status`, `null` when there was no answer at all) and only a
  404 from the API becomes a 404 - everything else is a 503, and it is logged
  server-side, which is the only trace a rendered error leaves.
- **The locale is now resolved twice**, once by the server and once by the
  hydrating client, and Svelte claims the server's text nodes rather than
  comparing them - so the two resolutions have to agree by construction, not by
  luck. What makes them agree is the middleware, not a shortened strategy list.
  See [Locale under SSR](#locale-under-ssr).

### Locale under SSR

The strategy list is `["cookie", "preferredLanguage", "baseLocale"]`
([`vite.config.ts`](../../vite.config.ts)), and
[`src/hooks.server.ts`](../../src/hooks.server.ts) runs `paraglideMiddleware`.

**The middleware is the load-bearing half, not the list.** `getLocale()` skips
`localStorage` and `preferredLanguage` whenever `isServer`, which reads like a
ban on both under SSR - and that reading cost this site its automatic language
detection for two days. What actually happens is that `paraglideMiddleware`
resolves the locale from the REQUEST, `Accept-Language` included, and runs the
entire render inside that binding, so `getLocale()` never reaches its own
strategy list on the server at all. Both sides therefore answer from the same
signal: the header the browser sent, and the `navigator.languages` it derives
that header from.

Measured on 2026-08-19, same Paraglide version and the same middleware in each:

| Site                  | Strategy                    | `Accept-Language: en` gets                     |
| --------------------- | --------------------------- | ---------------------------------------------- |
| `sky.mitv.fr`         | with `preferredLanguage`    | `<html lang="en">`, `Sky - ICM mapping`        |
| `gallery.mitv.fr`     | with `preferredLanguage`    | `<html lang="en">`                             |
| `portail-etu.emse.fr` | without, before this change | `<html lang="fr">`, for every visitor on earth |

`localStorage` stays out for the original reason, which does survive: nothing on
the server can read it. A reader who had picked English before SSR landed had it
there, and is detected from their browser now instead.

`LocaleToggle` writes the `PARAGLIDE_LOCALE` cookie and reloads, and the cookie
comes first, so an explicit choice still beats the header.

**The response now varies on both the cookie and `Accept-Language`, and carries
no `Vary` header for either.** Nothing caches it today - Bun serves the site on
its own host, and Cloudflare reports `DYNAMIC` for the sibling sites in the same
shape - so this costs nothing until somebody adds a cache rule for HTML, at which
point one visitor's language is served to the next. Any shared cache added later
owes `Vary: Cookie, Accept-Language`.

### `ORIGIN` is not optional

Every absolute URL the head carries - `og:url`, `og:image`, `link rel=canonical`,
every `<loc>` in the sitemap - is built from `page.url.origin`, never from a
constant, so the same code is correct on production, on localhost and in a
preview. Under SSR that origin comes from the request, and the adapter needs to
be told what it is: `ecosystem.config.cjs` sets
`ORIGIN=https://portail-etu.emse.fr`. Without it a locally started production
build advertises `https://localhost:4319` in its canonical tag.

### Running the production build locally

`ORIGIN=https://portail-etu.emse.fr PORT=4319 bun ./build/index.js`.

The `ORIGIN` matters for more than the canonical URL. SvelteKit's universal
`fetch` enforces CORS on the server for cross-origin loads, because the response
is serialised into the page for hydration and so must be something the browser
would have been allowed to read. Canari's `/api/public/*` answers a **localhost**
origin with two `Access-Control-Allow-Origin` headers (nginx adds `*`, and
social-service's allowlist echoes the origin), which is invalid and which
SvelteKit rejects - every detail page 503s. Answering as the production origin
gets a single `*` and works. That duplicate is a Canari-side defect; it is fixed
there, and this note stays because it is the symptom anyone will hit first.

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
which is the same identifier MiGallery keys avatars by. On any miss the UI falls
back to generated initials - `MemberCard` swaps to initials on the image's
`onerror`, so **any** failing status degrades, not only a 404. That is exactly why
the status is free to say what really happened, and must: nothing on screen
depends on it, and it is the only place the difference survives.

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

| Situation                              | Status | `Cache-Control`         | Cached in process | Logged  |
| -------------------------------------- | ------ | ----------------------- | ----------------- | ------- |
| Image found                            | 200    | `public, max-age=86400` | yes, 1 h          | no      |
| Upstream 404: this user has no avatar  | 404    | `public, max-age=600`   | yes, 10 min       | **no**  |
| Upstream 401 / 429 / 5xx               | 502    | `no-store`              | **never**         | `error` |
| Upstream unreachable (the fetch threw) | 502    | `no-store`              | **never**         | `error` |
| Nothing within `OUTBOUND_BUDGET_MS`    | 502    | `no-store`              | **never**         | `error` |

**Only an answer about the avatar may be remembered**, and exactly one status
qualifies (`isCacheableAbsence`). `!res.ok` reads like "no avatar" and is not: a
rotated `GALLERY_API_KEY` or one MiGallery 5xx, stored as an absence, would be
remembered as "these members have no face" for the whole TTL, for every visitor.

The same distinction governs the STATUS and the LOG, and both used to blur it:

- a refused key answered **404**, which is this portal asserting that the member
  has no face. It is a 502 now - a claim about MiGallery, which is what it is;
- a plain 404 was logged at `error`, on every faceless card. A member with no
  photo is the commonest case on the roster and is not an incident, so it is now
  silent. The lines that remain all accuse.

### The outbound budget

Every remote call carries `signal: AbortSignal.timeout(OUTBOUND_BUDGET_MS)` - 4 s,
declared once in [`src/lib/outbound.ts`](../../src/lib/outbound.ts) and shared with
the two Canari public-API calls in `src/lib/canari.ts`. `fetch` has **no** default
deadline, so a MiGallery that accepted the connection and then said nothing held
this route open indefinitely.

That is the opposite failure from the one measured above, and both were live on
the same route at once: an unreachable upstream fails fast and gets amplified by
the missing cache, while an upstream with no deadline cannot fail at all. The
second is the worse of the two for the visitor, because there is no error to catch
and no fallback to reach - the loaders here degrade on a **throw**, and a request
with no deadline never throws. It expires as a `TimeoutError`, so the route's
`catch` is what reports it.

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
