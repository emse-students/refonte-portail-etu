# Portail Étudiant ICM - Technical Wiki

The read-only showcase (vitrine) of associative life at the École des Mines de
Saint-Étienne, and the open face of [Canari](https://canari-emse.fr).

This wiki is the canonical technical documentation. Start here.

## Contents

- [Architecture](architecture.md) - how the showcase renders, where its data
  comes from, and how avatars are served.
- [Deployment](deployment.md) - CI/CD, quality gates, environment and secrets.

## In one paragraph

The portal is a SvelteKit app that renders entirely in the browser
(`ssr = false`) and reads Canari's public, unauthenticated API
(`/api/public/*`) for associations, campaign lists and their public members.
Member avatars are proxied same-origin from MiGallery. There is no database, no
authentication and no write path: everything is managed inside Canari.
