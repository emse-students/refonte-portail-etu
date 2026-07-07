import type { Action } from "svelte/action";

/** Options for the {@link reveal} action. */
export interface RevealOptions {
	/** Stagger, in milliseconds, before the element settles into place. */
	delay?: number;
}

/**
 * Scroll-reveal: fades and lifts an element into view the first time it enters
 * the viewport, then stops observing. The visual transition lives in app.css
 * (`.reveal` / `.reveal.in-view`); this action only toggles the `in-view` class.
 *
 * Honors prefers-reduced-motion by revealing immediately with no animation, and
 * degrades to instantly visible when IntersectionObserver is unavailable.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, params) => {
	const delay = params?.delay ?? 0;
	if (delay) node.style.setProperty("--reveal-delay", `${delay}ms`);

	const reduce =
		typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduce || typeof IntersectionObserver === "undefined") {
		node.classList.add("in-view");
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add("in-view");
					observer.disconnect();
					break;
				}
			}
		},
		{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
	);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
};
