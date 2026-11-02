import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { memberPhotoUrl } from "#lib/media";
import { CANARI_URL } from "#lib/canari";
import MemberCard from "#lib/components/MemberCard.svelte";
import CarteVieAsso from "#lib/components/CarteVieAsso.svelte";
import type {
	CanariAssociation,
	CanariMember,
	PublishedCarte,
	PublishedCarteCard,
} from "#lib/types";

/**
 * A member's photo is reached through the `avatarUrl` Canari hands out, never through the account id
 * (`userId`, the MiConnect `sub`) the public API used to carry: that id names a person across every
 * system of the ecosystem, and it sat in every `<img src>` this showcase drew.
 *
 * Canari and this repository deploy separately, so BOTH payload shapes are pinned here:
 *
 * - **the shape Canari serves today**: roster members and carte cards carry `userId` (and members
 *   `createdAt`), and no `avatarUrl`. Every face renders as initials, and nothing breaks - in
 *   particular two cards that share an account (or carry none) no longer collide on a list key;
 * - **the shape after Canari's anonymous-surface change**: no `userId` on members, an `avatarUrl`
 *   path on both, null on a carte card whose member left the association.
 */

/** A roster member exactly as Canari's current public API serves it: account id, no photo URL. */
const MEMBER_TODAY = {
	id: "row-1",
	userId: "sub-of-claire",
	role: "Presidente",
	isAdmin: true,
	displayName: "Claire Vanruymbeke",
	firstName: "Claire",
	lastName: "Vanruymbeke",
	promo: 2027,
	createdAt: "2026-09-01T00:00:00.000Z",
} as CanariMember;

/** The same member after Canari's change: the account id and join date are gone, the photo is a path. */
const MEMBER_NEXT: CanariMember = {
	id: "row-1",
	role: "Presidente",
	isAdmin: true,
	displayName: "Claire Vanruymbeke",
	firstName: "Claire",
	lastName: "Vanruymbeke",
	promo: 2027,
	avatarUrl: "/api/public/members/row-1/avatar",
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("memberPhotoUrl", () => {
	it("resolves Canari's path against the Canari origin", () => {
		expect(memberPhotoUrl("/api/public/members/row-1/avatar")).toBe(
			`${CANARI_URL}/api/public/members/row-1/avatar`
		);
	});

	it("is null when there is no photo to load, so no request is made", () => {
		expect(memberPhotoUrl(undefined)).toBeNull();
		expect(memberPhotoUrl(null)).toBeNull();
		expect(memberPhotoUrl("")).toBeNull();
	});

	it("accepts an absolute URL on the Canari origin", () => {
		const url = `${CANARI_URL}/api/public/members/row-1/avatar`;
		expect(memberPhotoUrl(url)).toBe(url);
	});

	it("refuses any other origin, protocol-relative included, and says so", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(memberPhotoUrl("https://elsewhere.example/a.png")).toBeNull();
		expect(memberPhotoUrl("//elsewhere.example/a.png")).toBeNull();
		expect(memberPhotoUrl("javascript:alert(1)")).toBeNull();
		expect(warn).toHaveBeenCalledTimes(3);
		expect(warn.mock.calls[0][0]).toContain("[MEMBER_PHOTO]");
	});
});

describe("MemberCard", () => {
	it("draws initials and requests no photo from today's payload, never the account id", () => {
		const { container, getByText } = render(MemberCard, { member: MEMBER_TODAY });
		expect(getByText("CV")).toBeInTheDocument();
		expect(container.querySelector("img")).toBeNull();
		expect(container.innerHTML).not.toContain("sub-of-claire");
	});

	it("loads the photo from the avatarUrl of the next payload", () => {
		const { container } = render(MemberCard, { member: MEMBER_NEXT });
		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			`${CANARI_URL}/api/public/members/row-1/avatar`
		);
	});

	it("falls back to initials when the photo does not load (Canari answers 404 for no photo)", async () => {
		const { container, getByText } = render(MemberCard, { member: MEMBER_NEXT });
		await fireEvent.error(container.querySelector("img")!);
		expect(container.querySelector("img")).toBeNull();
		expect(getByText("CV")).toBeInTheDocument();
	});
});

describe("CarteVieAsso member cards", () => {
	// The map scales one poster-sized stage by the frame's rendered width, which jsdom never lays
	// out: give every element a width and a ResizeObserver so the stage, and its cards, render.
	const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, "clientWidth", {
			configurable: true,
			get: () => 1600,
		});
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(private readonly cb: ResizeObserverCallback) {}
				observe(target: Element) {
					this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
				}
				unobserve() {}
				disconnect() {}
			}
		);
	});
	afterAll(() => {
		if (width) Object.defineProperty(HTMLElement.prototype, "clientWidth", width);
		vi.unstubAllGlobals();
	});

	const ASSO = {
		id: "asso-1",
		slug: "bde",
		name: "BDE",
		logoMediaId: null,
		logoUrl: null,
		color: "#e09f3e",
		contactEmail: null,
	} as CanariAssociation;

	/** One unit with the given cards, the rest of the poster reduced to what renders them. */
	const carteWith = (cards: Partial<PublishedCarteCard>[]): PublishedCarte =>
		({
			version: 2,
			aspectRatio: 1.41421,
			stage: { w: 1600, h: 1131 },
			background: { dataUrl: null, scrimOpacity: 0 },
			style: {
				pageBg: "#fdf3e3",
				scrimColor: "#3a2a12",
				cardBg: "#ffffff",
				cardTextColor: "#374151",
				directoryBg: "#ffffff",
				directoryTextColor: "#1f2937",
				directoryMutedColor: "#6b7280",
			},
			title: null,
			texts: [],
			directory: null,
			units: [
				{
					assoId: "asso-1",
					x: 0,
					y: 0,
					w: 400,
					h: 430,
					scale: 1,
					z: 1,
					color: null,
					colorFallback: "#e09f3e",
					blob: { x: 95, y: 67, size: 210, radius: "50%" },
					logo: { x: 154, y: 88, w: 92, h: 92, radius: "50%", initialsSize: 36, initials: "B" },
					name: { x: 123, y: 184, w: 154, size: 15, emailSize: 5.25 },
					cards: cards.map((c) => ({
						name: "Claire Vanruymbeke",
						role: "",
						initials: "CV",
						x: 0,
						y: 0,
						w: 73,
						photo: 61,
						nameSize: 6.8,
						roleSize: 6,
						...c,
					})) as PublishedCarteCard[],
				},
			],
		}) as PublishedCarte;

	/** Card photos, i.e. every `<img>` but the association logo (absent: the fixture has none). */
	const photos = (container: HTMLElement) =>
		[...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));

	it("renders today's cards as initials, two cards sharing an account id included", () => {
		// Keyed on `userId`, the same person on two cards was a duplicate-key error that took the map down.
		const today = [{ userId: "sub-of-claire" }, { userId: "sub-of-claire", initials: "CV2" }];
		const { container, getByText } = render(CarteVieAsso, {
			carte: carteWith(today as Partial<PublishedCarteCard>[]),
			associations: [ASSO],
		});
		expect(getByText("CV")).toBeInTheDocument();
		expect(getByText("CV2")).toBeInTheDocument();
		expect(photos(container)).toEqual([]);
		expect(container.innerHTML).not.toContain("sub-of-claire");
	});

	it("loads each card's photo from the next payload's avatarUrl, initials only where it is null", () => {
		const next = [
			{ userId: "sub-of-claire", avatarUrl: "/api/public/members/row-1/avatar" },
			{ userId: "sub-of-someone-who-left", avatarUrl: null, initials: "XY" },
		];
		const { container, getByText } = render(CarteVieAsso, {
			carte: carteWith(next as Partial<PublishedCarteCard>[]),
			associations: [ASSO],
		});
		expect(photos(container)).toEqual([`${CANARI_URL}/api/public/members/row-1/avatar`]);
		expect(getByText("XY")).toBeInTheDocument();
		expect(container.innerHTML).not.toContain("sub-of");
	});
});
