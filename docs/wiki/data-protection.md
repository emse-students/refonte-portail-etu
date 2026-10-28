# Data protection (GDPR)

The portal is public and has no sign-in, so every personal datum it shows is shown to the whole
internet. This page records what is shown, where it comes from, the rules that follow, and the one
thing this repository cannot fix alone. Visitor-facing texts: `/mentions-legales` and
`/confidentialite` (French only on purpose - they are the text of record; only their chrome goes
through Paraglide).

## What is personal data here

| Datum                                                 | Where it comes from                 | Where it is shown                                                                      |
| ----------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| First name, last name, promo, role                    | Canari public API (`/api/public/*`) | member cards on `/associations/[handle]` and `/lists/[handle]`                         |
| Photo                                                 | MiGallery, via the avatar proxy     | member cards, Carte de la Vie Asso                                                     |
| Names, roles, photos, directory of the "Carte" poster | Canari, a **published snapshot**    | `/associations`, while a carte is live                                                 |
| Account id (`userId`, the MiConnect `sub`)            | Canari public API                   | **not displayed**, but present in the page payload and in every avatar URL (see below) |

The site stores nothing: no database, no cookie but the language preference, no analytics. Retention
is therefore the upstream's: a member removed in Canari disappears from the next render, a photo may
sit in the avatar cache for up to an hour (`avatarCache`), and the Carte snapshot lives until the
next republish. A takedown request is handled within 30 days by removing the person in Canari and,
if they are on a live Carte, republishing it.

Legal basis: legitimate interest of the associations to present their teams (art. 6.1.f), with an
objection right (art. 21) honoured on request at `bureau@rootz-emse.fr`.

## The rules, and the code that carries them

1. **A page that prints member names is `noindex`.** One rule, [`src/lib/robots.ts`](../../src/lib/robots.ts),
   stated twice: `<meta name="robots" content="noindex">` through `SeoMeta.noindex` and
   `X-Robots-Tag: noindex` set by the loader (`setHeaders`). It applies to
   `/associations/[handle]` and `/lists/[handle]` whenever the entity has members, and to
   `/associations` while a carte is live. An association with no member stays indexable.
   `/api/*` (avatars) gets the header from `hooks.server.ts`.
2. **Those pages are not in the sitemap** (`sitemapEligible`: a directory `memberCount` above zero
   keeps the entry out; the directory itself is out while a carte is live). A sitemap entry for a
   `noindex` page is a contradiction crawlers report as an error. The two legal pages are in it.
3. **No third party at render time.** Google Fonts was imported from `app.css`, which sent every
   visitor's IP to Google. Inter (`@fontsource-variable/inter`), Glass Antiqua
   (`@fontsource/glass-antiqua`) and Fira Mono are self-hosted. Do not add a remote stylesheet,
   script or font; `grep -rn "googleapis\|gstatic" src` must stay empty.

## What this repository cannot fix: the account id

The Canari public API returns `userId` (the MiConnect `sub`) on every member and card. The avatar
proxy `/api/users/[userId]/avatar` is keyed by that same id because it is also MiGallery's key, so
the id is visible in the avatar `src` of every card, and in the serialised page data. It is an
identifier, not a name, but it is stable and correlates a person across Canari, MiGallery and this
site.

It cannot be hidden here without breaking avatars: the `<img src>` needs a key the proxy can map back
to MiGallery, and the loaders are universal (they run in the visitor's browser on client-side
navigation), so there is no server-only secret available to mint an opaque token. **The fix is on
Canari's side**: the public API should return an opaque, public avatar token (or the avatar URL
itself) instead of the account id, and the proxy would accept that token. Until then the id is not
rendered as text anywhere, and the avatar route accepts only `[a-zA-Z0-9_-]{1,128}`.

## Owed by a human

- The director of publication is written as "le/la président(e) de l'association Rootz" because no
  name was supplied; name the person when the mandate is known.
- The host is described as the school's shared server administered with the DSI; no company is
  named.
