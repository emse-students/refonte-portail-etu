# Data protection (GDPR)

The portal is public and has no sign-in, so every personal datum it shows is shown to the whole
internet. This page records what is shown, where it comes from, the rules that follow, and the one
thing this repository cannot fix alone. Visitor-facing texts: `/mentions-legales` and
`/confidentialite` (French only on purpose - they are the text of record; only their chrome goes
through Paraglide).

## What is personal data here

| Datum                                                 | Where it comes from                                     | Where it is shown                                              |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| First name, last name, promo, role                    | Canari public API (`/api/public/*`)                     | member cards on `/associations/[handle]` and `/lists/[handle]` |
| Photo                                                 | MiGallery, served by Canari at the member's `avatarUrl` | member cards, Carte de la Vie Asso                             |
| Names, roles, photos, directory of the "Carte" poster | Canari, a **published snapshot**                        | `/associations`, while a carte is live                         |

The site stores nothing: no database, no cookie but the language preference, no analytics. Retention
is therefore the upstream's: a member removed in Canari disappears from the next render (and their
photo address with their roster row), and the Carte snapshot lives until the
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
2. **Those pages are not in the sitemap** (`sitemapEligible`: a directory `memberCount` above zero
   keeps the entry out; the directory itself is out while a carte is live). A sitemap entry for a
   `noindex` page is a contradiction crawlers report as an error. The two legal pages are in it.
3. **No third party at render time.** Google Fonts was imported from `app.css`, which sent every
   visitor's IP to Google. Inter (`@fontsource-variable/inter`), Glass Antiqua
   (`@fontsource/glass-antiqua`) and Fira Mono are self-hosted. Do not add a remote stylesheet,
   script or font; `grep -rn "googleapis\|gstatic" src` must stay empty.

## The account id is not read

Until 2026-11-02 this showcase built each photo URL from the member's `userId` (the MiConnect `sub`)
and proxied it to MiGallery, so that stable identifier, which correlates a person across Canari,
MiGallery and this site, sat in the `src` of every face. Canari now hands out the photo address
itself (`avatarUrl`, keyed by the roster row), the roster list is keyed by its row `id`, the carte
cards by their position, and the proxy is gone. No type here declares `userId`, so no code can come
to depend on it again. A Canari that still SENDS it is read without it: the field travels in the
API response, and nothing here renders, links or keys on it (`tests/memberPhoto.test.ts`).

## Owed by a human

- The director of publication is written as "le/la président(e) de l'association Rootz" because no
  name was supplied; name the person when the mandate is known.
- The host is described as the school's shared server administered with the DSI; no company is
  named.
