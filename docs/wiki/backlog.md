# Backlog

Wanted, understood, and NOT scheduled. An item here has a reason it is not being
done now; an item with no such reason belongs in the work, not on this page.

## Thirteen navigations that no linter here looks at any more

**Superseded 2026-08-27 by the move to oxvelte**, and reopened smaller rather
than closed - the tool changed, the question did not.

The old item was that [`eslint.config.js`] spread
`svelte.configs.recommended.rules`, which in eslint-plugin-svelte 3 is an ARRAY
of flat configs whose `.rules` is `undefined`, so the Svelte recommended set had
never actually run. Measured with the real set spread in, on 2026-08-19: **17
errors** - 14 `svelte/no-navigation-without-resolve` across eight components, 2
`svelte/require-each-key` in `Header.svelte`, 1 `svelte/prefer-svelte-reactivity`
in `lists/+page.svelte`.

oxvelte now runs its recommended set for real, and reports **4** of those 17:

| Finding                                                 | Now                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2 `require-each-key` in `Header.svelte`                 | **fixed** - keyed on `item.href`, four unique routes                                                         |
| 1 `prefer-svelte-reactivity` in `lists/+page.svelte`    | **justified in place** - a local accumulator inside `$derived.by`, thrown away before anything can mutate it |
| 1 `no-navigation-without-resolve` in `GlassCard.svelte` | **justified in place** - `href` is a prop, so the component cannot resolve what the caller has already built |
| the other 13 `no-navigation-without-resolve`            | **nobody looks at them now**                                                                                 |

**That last row is the item.** The 13 did not go away and were not fixed: oxvelte
implements the rule more narrowly than eslint-plugin-svelte did. Measured - it
flags a shorthand `{href}` and does not flag a string literal, so the three
`href="/associations"`-style links in `Footer.svelte` that ESLint reported draw
nothing at all from the new linter. The gate is green and thirteen call sites
that the old gate had an opinion about are now unwatched.

They work today for the reason they always did: the site sets
`paths: { relative: true }` and no `base`, so every one of those links resolves
correctly. That is a property of the deployment, not of the code.

**This is the same question, on the same rule, that Canari and MiGallery park.**
Canari suppresses 92 of them and MiGallery 16, both behind an
`oxvelte.config.json` inherited from ESLint; the entry is in that repository's
`docs/wiki/backlog.md` under Tooling. Whatever is decided there should be decided
here, and the three repositories should stop disagreeing about it.

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
