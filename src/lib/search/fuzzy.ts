/**
 * Fuzzy text matching for the association directory, and for anything else this site ever searches.
 *
 * The requirement it answers is the ecosystem's, written down in the canari repository at
 * `docs/wiki/search-contract.md`: a search box tolerates a typo and an inversion of the words, and
 * RANKS its answers by how close they are rather than returning yes or no. This directory used to
 * do none of that - `name.toLowerCase().includes(query)` - so a reader who mistyped a name they
 * could see on the screen was told there was no such association.
 *
 * Nothing here is stateful and nothing reads a clock, so the same query over the same rows always
 * comes back in the same order. A list that reshuffles between two keystrokes makes the reader
 * click the wrong tile.
 */

// oxlint-disable unicorn/no-new-array -- every `new Array<T>(n)` below is a row of a dynamic
// programming matrix, pre-sized and then written in full by the loop that follows. The rule warns
// about the reader who cannot tell a length from a single element; the explicit type argument
// answers that, and `Array.from({ length: n })` would allocate and iterate on the one path in this
// module that runs per candidate row.

/** Below this many characters a token carries no information: every name would match it. */
const SHORT_TOKEN_LENGTH = 3;
/** From this many characters a token is long enough for a second edit to cost almost nothing. */
const LONG_TOKEN_LENGTH = 8;

/** A token matched letter for letter. */
const SCORE_EXACT = 1;
/** The typed token opens the candidate - "asso" for "association", which is how a name is typed. */
const SCORE_PREFIX = 0.9;
/** The typed token sits inside the candidate but does not open it. */
const SCORE_CONTAINS = 0.7;
/** A token reached only through edits, before the per-edit penalty below. */
const SCORE_FUZZY = 0.6;
/** Charged per edit past the first, so a closer spelling always outranks a further one. */
const FUZZY_EDIT_PENALTY = 0.15;

/** How much of the final score comes from how WELL the typed words matched. */
const QUALITY_WEIGHT = 0.85;
/** ...and how much from how much of the candidate they accounted for. The two add up to 1. */
const COVERAGE_WEIGHT = 0.15;

/**
 * The form everything is compared in: lower case, no accents, no punctuation, single spaces.
 *
 * Accent folding is not a nicety - a directory searched for "eleves" must find "Eleves" however it
 * was accented, and nobody types the accent while scanning a list. Punctuation becomes a separator
 * rather than being deleted, so "Arts-Sciences" is two tokens and answers a query that types only
 * one of them.
 */
export function normalizeForSearch(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[^\p{Letter}\p{Number}]+/gu, " ")
		.trim();
}

/** The normalized words of a string, in order. Empty for a string that normalizes to nothing. */
export function tokenize(value: string): string[] {
	const normalized = normalizeForSearch(value);

	return normalized === "" ? [] : normalized.split(" ");
}

/**
 * Optimal string alignment distance: Levenshtein, plus the swap of two adjacent characters counted
 * as ONE edit rather than two.
 *
 * The transposition is the whole reason this is not plain Levenshtein. It is the commonest typo
 * there is, and Levenshtein charges it the same two edits as two unrelated mistakes - which pushes
 * it outside any tolerance small enough to stay useful on a short name.
 *
 * @param a one string, already normalized
 * @param b the other
 * @returns the number of edits between them
 */
export function editDistance(a: string, b: string): number {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	// Three rows are everything the recurrence reads: the one being filled, the one above it, and
	// the one above THAT, which is where a transposition is charged from.
	let twoRowsUp = new Array<number>(b.length + 1);
	let previousRow = new Array<number>(b.length + 1);
	let currentRow = new Array<number>(b.length + 1);

	for (let j = 0; j <= b.length; j++) {
		previousRow[j] = j;
	}

	for (let i = 1; i <= a.length; i++) {
		currentRow[0] = i;

		for (let j = 1; j <= b.length; j++) {
			const substitution = a[i - 1] === b[j - 1] ? 0 : 1;

			let best = Math.min(
				previousRow[j] + 1,
				currentRow[j - 1] + 1,
				previousRow[j - 1] + substitution
			);

			// Guarded on i > 1 and j > 1, so `twoRowsUp` is only read once it has been filled.
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				best = Math.min(best, twoRowsUp[j - 2] + 1);
			}

			currentRow[j] = best;
		}

		// The oldest row is recycled as the next one to fill; every cell of it is overwritten above
		// before anything reads it.
		[twoRowsUp, previousRow, currentRow] = [previousRow, currentRow, twoRowsUp];
	}

	return previousRow[b.length];
}

/**
 * How many edits a token may be wrong by, taken from the SHORTER of the two tokens compared.
 *
 * The ecosystem's ladder, measured rather than chosen: against a roster of 207 people with every
 * single-keystroke fault simulated, a tolerance of 2 below eight characters recovered no typo that
 * a tolerance of 1 did not - a single wrong keystroke is one edit by construction - while offering
 * a wrong answer on roughly half of all queries. Taking the tolerance from the shorter token is
 * what stops a three-letter query buying two edits against a long name, which at that ratio matches
 * most of a directory and is the same as not filtering.
 *
 * The numbers and what every other repository owes are in canari at `docs/wiki/search-contract.md`.
 * Change them there, not here.
 */
function maxEdits(length: number): number {
	if (length <= SHORT_TOKEN_LENGTH) return 0;
	if (length < LONG_TOKEN_LENGTH) return 1;

	return 2;
}

/**
 * How well one typed word matches one candidate word, or null when it does not match at all.
 *
 * The four tiers are ordered so a better KIND of match always outranks a worse one whatever the
 * lengths involved: an exact word beats a prefix, a prefix beats a substring, and anything spelled
 * correctly beats anything reached through edits.
 */
function tokenScore(query: string, candidate: string): number | null {
	if (query === candidate) return SCORE_EXACT;
	if (candidate.startsWith(query)) return SCORE_PREFIX;
	if (candidate.includes(query)) return SCORE_CONTAINS;

	const tolerance = maxEdits(Math.min(query.length, candidate.length));
	if (tolerance === 0) return null;

	const distance = editDistance(query, candidate);
	if (distance > tolerance) return null;

	return SCORE_FUZZY - FUZZY_EDIT_PENALTY * (distance - 1);
}

/**
 * How well a query matches a subject, in [0, 1], or null when it does not match.
 *
 * Word order is irrelevant by construction: each typed word is assigned to whichever unused word of
 * the subject it scores best against, so "sciences arts" and "arts sciences" reach the same
 * association. Every typed word must land somewhere, because a query is a conjunction - someone
 * typing two words is asking for the entry that answers both, and scoring a half match would put
 * every entry answering one of them in the list.
 *
 * The assignment is greedy: each word takes its best remaining partner in the order it was typed.
 * An optimal assignment would cost a Hungarian solve per candidate and can only differ when two
 * typed words compete for the same subject word.
 *
 * @param query what the reader typed
 * @param subject the text this candidate is searched by
 * @returns the score, higher being closer, or null when a typed word matched nothing
 */
export function fuzzyScore(query: string, subject: string): number | null {
	const queryTokens = tokenize(query);
	if (queryTokens.length === 0) return null;

	const subjectTokens = tokenize(subject);
	if (subjectTokens.length === 0) return null;

	const taken = new Array<boolean>(subjectTokens.length).fill(false);
	let total = 0;

	for (const queryToken of queryTokens) {
		let bestScore: number | null = null;
		let bestIndex = -1;

		for (let i = 0; i < subjectTokens.length; i++) {
			if (taken[i]) continue;

			const score = tokenScore(queryToken, subjectTokens[i]);
			// Strictly greater, so a tie is won by the EARLIER word of the subject and the result
			// does not depend on which way the loop happens to run.
			if (score !== null && (bestScore === null || score > bestScore)) {
				bestScore = score;
				bestIndex = i;
			}
		}

		if (bestScore === null) return null;

		taken[bestIndex] = true;
		total += bestScore;
	}

	const quality = total / queryTokens.length;
	// How much of the SUBJECT the query accounted for: what separates "BDE" from "BDE des anciens"
	// on the query "bde". Both match word for word, and the one with nothing left over was meant.
	const coverage = queryTokens.length / subjectTokens.length;

	return QUALITY_WEIGHT * quality + COVERAGE_WEIGHT * Math.min(coverage, 1);
}

/**
 * The items a query matches, closest first.
 *
 * An empty query matches everything and changes no order - a search box that has not been typed in
 * is not a filter.
 *
 * `secondaryOf` is for prose: a description is matched by plain substring, never by edit distance.
 * Tolerating a typo over a paragraph is not tolerance, it is a match on everything - a paragraph
 * long enough contains a word within one edit of almost any query. Prose can therefore only
 * CONFIRM a query, never approximate it, and every entry matched that way ranks below every entry
 * whose name matched, in the order it was given.
 *
 * @param query what the reader typed
 * @param items the candidates
 * @param subjectOf the name each candidate is searched by
 * @param secondaryOf optional prose searched by substring only
 * @returns the matching candidates, ranked
 */
export function fuzzyRank<T>(
	query: string,
	items: readonly T[],
	subjectOf: (item: T) => string,
	secondaryOf?: (item: T) => string
): T[] {
	const normalizedQuery = normalizeForSearch(query);
	if (normalizedQuery === "") {
		return [...items];
	}

	const scored: { item: T; score: number; subject: string }[] = [];
	const byProse: T[] = [];

	for (const item of items) {
		const subject = normalizeForSearch(subjectOf(item));
		const score = fuzzyScore(normalizedQuery, subject);

		if (score !== null) {
			scored.push({ item, score, subject });
			continue;
		}

		if (secondaryOf && normalizeForSearch(secondaryOf(item)).includes(normalizedQuery)) {
			byProse.push(item);
		}
	}

	// Sorted down to a total order on purpose. Two entries scoring the same must come back in the
	// same order on every call, or the list reorders itself under the reader between keystrokes.
	// `localeCompare` is deliberately avoided as the last tiebreak: it reads a collation from the
	// environment, so it can order two rows differently on the server and in the browser.
	scored.sort(
		(a, b) =>
			b.score - a.score ||
			a.subject.length - b.subject.length ||
			(a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0)
	);

	return [...scored.map((entry) => entry.item), ...byProse];
}
