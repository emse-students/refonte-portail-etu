# SEO and link previews

The portal is the only public, login-free surface in the ecosystem. Canari is
end-to-end encrypted and behind an account, MiGallery is `Disallow: /` on
purpose, Sky is behind a login. So the head this site serves is not a courtesy -
it is the product, and it is the only thing a search engine or a link unfurler
ever gets.

## What was wrong, measured

Both of these were measured on production on 2026-08-19, before any change:

- `curl https://portail-etu.emse.fr/associations/bde` returned a `<head>`
  carrying charset, icon, viewport, a Google verification token, a logo preload
  and two stylesheet links. **No `<title>`, no description, no Open Graph, no
  canonical.** Every page of the site was identical to a crawler.
- `curl -o /dev/null -w "%{http_code}" https://portail-etu.emse.fr/sitemap.xml`
  returned **404**, while `static/robots.txt` carried
  `Sitemap: https://portail-etu.emse.fr/sitemap.xml`.

The two compound. A crawler that follows a `Sitemap:` line to a 404 does not
fall back to guessing, and the detail pages are linked only from markup that did
not exist until hydration. **The whole detail half of the site was uncrawlable by
construction**, and the half that was reachable had nothing to index.

The cause of the first is [`ssr = false`](architecture.md#server-side-rendering):
`<svelte:head>` never runs on the server, so writing meta tags at all was
pointless until SSR came back.

## The method

One component, one module, six call sites.

| Piece                      | File                                                                           | Job                                            |
| -------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| `SeoMeta` + graph builders | [`src/lib/seo.ts`](../../src/lib/seo.ts)                                       | What a page contributes, and the JSON-LD nodes |
| `<Seo {meta} />`           | [`src/lib/components/Seo.svelte`](../../src/lib/components/Seo.svelte)         | Emits the head, from the request's own origin  |
| `/sitemap.xml`             | [`src/routes/sitemap.xml/+server.ts`](../../src/routes/sitemap.xml/+server.ts) | The link graph, built per request              |

Every route component renders `<Seo meta={...} />` and nothing else touches
`<svelte:head>`: `/`, `/associations`, `/lists`, `/liens`,
`/associations/[handle]`, `/lists/[handle]`.

### Absolute URLs come from the request

`og:image`, `og:url` and `link rel=canonical` are resolved by a machine with no
page context, so a relative path is silently useless to every one of them. They
are built from `page.url.origin` - never a constant - so the same code is right
on production, on localhost and in a preview build. Under SSR that means `ORIGIN`
must be set for the adapter; see
[architecture](architecture.md#origin-is-not-optional).

### JSON-LD, and the one thing that can bite

Each page emits a `schema.org` `@graph`:

- every page: the `WebSite`, publisher-linked to one `CollegeOrUniversity` node
  for Mines Saint-Etienne (`INSTITUTION_ID`);
- listing pages: an `ItemList` of what they link to;
- detail pages: an `Organization` with `memberOf` the school, plus a
  `BreadcrumbList`.

`memberOf` is the part that earns anything. "BDE" alone is not a name a search
engine can place; "BDE, member of Mines Saint-Etienne, at this postal address"
is. Absent fields are pruned rather than declared empty, which a validator
reports as malformed.

**`JSON.stringify` leaves `</script>` byte-for-byte intact, and inside a script
element that sequence ENDS the element** - everything after it parses as markup.
Association names and member names come from Canari and are typed by people, so
this is a live injection point, not a hypothetical one. `serializeJsonLd`
escapes `<` and `&` as unicode escapes: identical to a JSON parser, inert to the
HTML tokenizer. Covered by `tests/seo.test.ts`.

The `<script>` element itself is assembled in `seo.ts`, a plain `.ts` module,
rather than in the component. Built inside a `.svelte` file the closing tag needs
an escape to stop the Svelte parser ending the block early - noise that reads as
a mistake, that the linter flags as a useless escape, and that the next person is
one cleanup away from deleting.

### The sitemap is built per request, and is allowed to be short

A static list of four static routes tells a crawler nothing it could not already
see, and the associations change without a deploy - so `/sitemap.xml` is rendered
per request (`prerender = false`) with a one-hour `Cache-Control`.

Both halves - associations and lists - are fetched independently and each
`.catch(() => [])`. **A short sitemap is worth serving; a 500 is not**, because a
crawler treats a broken sitemap as a reason to stop asking. Archived entities are
skipped: still reachable by URL, simply not something to put in front of a search
engine on their own.

### A 404 is a claim, and only the API may make it

Both detail loaders used to answer 404 for any upstream failure. In a SPA that
cost a visitor a reload. Under SSR the same 404 tells Google the page does not
exist, and Google acts on it - one timeout during one crawl would deindex an
association that has been there for years.

So the distinction is carried as a TYPE and never read out of a message:
`CanariApiError.status` is the API's own status code, or `null` when the request
never got an answer at all. Only `404` may become a 404; everything else is a
503, which is the status that means "ask again". Both branches log server-side -
a rendered error page is otherwise the only trace, and it names nothing.
Covered by `tests/detailLoader.test.ts`.

## Verifying a change

Against a local production build (`bun run build`, then the command in
[architecture](architecture.md#running-the-production-build-locally)):

```sh
curl -s http://localhost:4319/associations/bde | grep -o '<title>[^<]*</title>'
curl -s http://localhost:4319/associations/bde | grep -o 'application/ld+json'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4319/sitemap.xml
```

`curl` is the right tool and a browser is not: a browser runs the JavaScript, so
it cannot tell you whether the SERVER wrote the head. That is the whole failure
this page exists to prevent.
