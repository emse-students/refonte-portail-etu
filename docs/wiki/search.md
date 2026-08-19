# Search

The directory's search box, and the one module behind it: `src/lib/search/fuzzy.ts`.

## What it promises

The promise is the ecosystem's, not this repository's. It is written down once, in the canari
repository at `docs/wiki/search-contract.md`, together with the measurement that produced its
numbers. Three things follow from it:

1. **A typo still finds the association.** Case and accents are folded away first; a single wrong
   keystroke - a swap, a missing letter, a wrong letter - still reaches the name.
2. **Word order is irrelevant.** "sciences arts" and "arts sciences" are the same query. It comes
   for free from matching word to word instead of query to string.
3. **The answers are ranked, not filtered.** Closest first.

And one rule that is easy to get backwards: every typed word must match something. A query is a
conjunction - someone typing two words wants the entry that answers both.

## What it replaced

Until 2026-08-19 the whole matcher was, in `src/routes/associations/+page.svelte`:

```ts
a.name.toLowerCase().includes(query.toLowerCase()) ||
	(a.description ?? "").toLowerCase().includes(query.toLowerCase());
```

A reader who mistyped a name they could see on the screen was told there was no such association,
and the results came back in whatever order the API returned them.

## The ladder

**Optimal string alignment distance** - Levenshtein with the swap of two adjacent characters charged
as ONE edit rather than two. That single difference is the commonest typo there is.

**Tolerance is taken from the SHORTER of the two words compared: 0 edits up to 3 characters, 1 from
4 to 7, 2 from 8.** Measured, not chosen: against a roster of 207 people with every single-keystroke
fault simulated, a second edit below eight characters recovered no typo that the first did not - a
single wrong keystroke is one edit by construction - while offering a wrong answer on roughly half
of all queries. Taking the tolerance from the shorter word is what stops a three-letter query buying
two edits against a long name, which at that ratio matches most of a directory.

The tolerance applies inside the fuzzy tier only. An exact word, a prefix and a substring are
matched before it and are never charged an edit: somebody who typed "clu" has not made a mistake,
they have stopped typing. That is also what makes the 0 rung survivable - a three-character query is
almost always a prefix.

Change these numbers in the contract page, not here.

## Prose is matched differently, on purpose

`fuzzyRank` takes an optional second subject - here, the association's description - and matches it
by **plain substring only, never by edit distance**. Tolerating a typo over a paragraph is not
tolerance, it is a match on everything: a paragraph long enough contains a word within one edit of
almost any query. So prose can confirm a query but never approximate it, and every entry matched
that way ranks below every entry whose NAME matched.

## The order is total, on purpose

`fuzzyRank` sorts by score, then by name length, then by a plain string comparison. Two entries
scoring the same must come back in the same order on every call, or the list reorders itself under
the reader between two keystrokes and they click the tile that moved into the row they were aiming
at. `localeCompare` is deliberately avoided as the last tiebreak: it reads a collation from the
environment, so it can order two rows differently on the server and in the browser.

## Pinned by

`tests/fuzzy.test.ts`. It asserts the promise and every rung of the ladder, including one case that
fails on the ladder this repository would have had if it had picked its own - which is the only
thing that makes the others worth having.

## Related

- [Architecture](architecture.md) - where the associations come from
- The contract and its measurement: canari, `docs/wiki/search-contract.md`
