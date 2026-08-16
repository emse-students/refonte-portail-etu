/**
 * THE ONE DEADLINE EVERY REMOTE CALL THIS SHOWCASE MAKES ANSWERS TO.
 *
 * `fetch` has no default timeout. None of this portal's remote calls - MiGallery for a member's
 * photo, Canari's public API for the directory and the carte - carried a deadline, so an upstream
 * that accepted the connection and then said nothing held it, and the page waiting behind it, for
 * as long as it liked. There is no error to catch in that state and no fallback to reach: the
 * association page simply never finishes rendering, and the `error` handler that would have shown
 * something useful never runs.
 *
 * That is the opposite failure from the one measured on 2026-08-06 (479 recorded 502s from a single
 * burst of outbound connection failures, amplified by the absence of a cache): a request that
 * cannot be reached fails fast and is retried, while a request with no deadline cannot fail at all.
 * Both were live at the same time on the same route.
 *
 * One constant rather than one per call site, because a budget that differs by caller is a budget
 * nobody can state. It is deliberately the same 4 s Canari and Sky use for the same upstream.
 *
 * It expires as a THROW (`TimeoutError`), never as a status, so it is a `catch` - not a status
 * check - that has to name the upstream as unreachable.
 */
export const OUTBOUND_BUDGET_MS = 4000;
