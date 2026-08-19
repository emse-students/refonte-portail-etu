# Backlog

Wanted, understood, and NOT scheduled. An item here has a reason it is not being
done now; an item with no such reason belongs in the work, not on this page.

## The Svelte recommended ruleset is off, and the config says otherwise

[`eslint.config.js`](../../eslint.config.js) spreads
`svelte.configs.recommended.rules`. In eslint-plugin-svelte 3 that export is an
ARRAY of flat configs, so `.rules` is `undefined` and the spread has always
contributed nothing. The Svelte rules this repo actually runs are the two written
out by hand below it.

Measured 2026-08-19, with the real set spread in
(`Object.assign({}, ...svelte.configs.recommended.map((c) => c.rules || {}))`):
**17 errors**, of which

- 14 `svelte/no-navigation-without-resolve` across eight components (`BioLink`,
  `Button`, `CarteVieAsso`, `EntityDetail`, `FeaturedLinks`, `GlassCard`,
  `Header`, `Footer`, `+page`) - SvelteKit 2.26's `resolve()` for `paths.base`.
  The site sets `paths: { relative: true }` and no `base`, so every one of those
  links works today; adopting the rule is a real refactor, not a fix.
- 2 `svelte/require-each-key` in `Header.svelte`.
- 1 `svelte/prefer-svelte-reactivity` in `lists/+page.svelte` (a plain `Map`).

Not blocking anything, and it touches nine files for no behaviour change, so it
waits for a session of its own rather than riding along with unrelated work.

**Already fixed, and not part of this item:** the config was also missing
`processor: "svelte/svelte"`, without which `svelte/comment-directive` reports
nothing and `<!-- eslint-disable ... -->` inside markup is silently inert - a
disable comment that reads as applied and is not. That is a mechanism, not an
opinion, so it landed with the SEO work.

## Accept-Language detection under SSR

Paraglide resolves the locale from a cookie only
([architecture](architecture.md#locale-under-ssr)); `preferredLanguage` cannot be
used because Paraglide skips it on the server, which would leave the server and
the hydrating client disagreeing. A first-time English-preferring visitor
therefore gets French until they click the toggle.

Making detection work needs one of: a server-side `Accept-Language` read wired
through a custom strategy that ALSO answers identically on the client, or a
`/en` URL prefix (`url` strategy), which is the option that also gives search
engines separate indexable URLs and `hreflang`. The second is the better answer
and is a routing change across every link in the site.
