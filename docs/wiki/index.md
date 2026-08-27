# Portail Étudiant ICM - Technical Wiki

The read-only showcase (vitrine) of associative life at the École des Mines de
Saint-Étienne, and the open face of [Canari](https://canari-emse.fr).

This wiki is the canonical technical documentation. Start here.

## Contents

- [Architecture](architecture.md) - how the showcase renders, where its data
  comes from, and how avatars are served.
- [SEO and link previews](seo.md) - the head, the JSON-LD graph and the
  sitemap; what a crawler and an unfurler actually get.
- [Search](search.md) - the directory's search box, the ecosystem's
  tolerance ladder, and why prose is matched differently from a name.
- [Deployment](deployment.md) - CI/CD, quality gates, environment and secrets.
- [Tooling](tooling.md) - what formats, lints and typechecks the repository, and
  what was measured before each tool was believed.
- [Backlog](backlog.md) - wanted, understood, and deliberately not scheduled.

## In one paragraph

The portal is a SvelteKit app that renders on the server and then hydrates
(`ssr = true`) and reads Canari's public, unauthenticated API
(`/api/public/*`) for associations, campaign lists and their public members.
Member avatars are proxied same-origin from MiGallery. There is no database, no
authentication and no write path: everything is managed inside Canari.
