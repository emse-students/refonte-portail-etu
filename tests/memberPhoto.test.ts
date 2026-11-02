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
 * A member's photo is reached through the `avatarUrl` Canari hands out (keyed by the roster row),
 * and the account id (`userId`, the MiConnect `sub`) is only a TRANSITIONAL fallback for a Canari
 * that does not send `avatarUrl` yet. Canari and this repository deploy separately, so the three
 * payload shapes the rollout passes through are all pinned here:
 *
 * 1. **today**: `userId`, no `avatarUrl` - the legacy photo through this showcase's MiGallery proxy;
 * 2. **the rollout**: `userId` AND `avatarUrl` - `avatarUrl` wins, the browser loads from Canari;
 * 3. **after the strip**: `avatarUrl` only - unchanged from 2, nothing needs `userId`.
 *
 * And on every shape, no list key depends on `userId`: the roster keys on its row `id`, the carte
 * cards on their position.
 */

const BASE = {
	id: "row-1",
	role: "Presidente",
	isAdmin: true,
	displayName: "Claire Vanruymbeke",
	firstName: "Claire",
	lastName: "Vanruymbeke",
	promo: 2027,
};
const AVATAR_PATH = "/api/public/members/row-1/avatar";
const FROM_CANARI = `${CANARI_URL}${AVATAR_PATH}`;
const LEGACY = "/api/users/sub-of-claire/avatar";

/** Shape 1, exactly as Canari's current public API serves it (`createdAt` included). */
const MEMBER_TODAY = {
	...BASE,
	userId: "sub-of-claire",
	createdAt: "2026-09-01T00:00:00.000Z",
} as CanariMember;
/** Shape 2: Canari adds `avatarUrl` and still sends `userId`. */
const MEMBER_ROLLOUT: CanariMember = {
	...BASE,
	userId: "sub-of-claire",
	avatarUrl: AVATAR_PATH,
};
/** Shape 3: `userId` and `createdAt` stripped. */
const MEMBER_STRIPPED: CanariMember = { ...BASE, avatarUrl: AVATAR_PATH };

afterEach(() => {
	vi.restoreAllMocks();
});

describe("memberPhotoUrl", () => {
	it("falls back to the legacy proxy only while avatarUrl is ABSENT", () => {
		expect(memberPhotoUrl({ userId: "sub-of-claire" })).toBe(LEGACY);
		expect(memberPhotoUrl({})).toBeNull();
	});

	it("prefers avatarUrl, resolved against the Canari origin, whether or not userId is there", () => {
		expect(memberPhotoUrl({ userId: "sub-of-claire", avatarUrl: AVATAR_PATH })).toBe(FROM_CANARI);
		expect(memberPhotoUrl({ avatarUrl: AVATAR_PATH })).toBe(FROM_CANARI);
	});

	it("reads a null avatarUrl as 'no public photo', never as a reason to use the account id", () => {
		// Canari answers null for a carte card whose member left the association: their face is no
		// longer public, and the account id must not bring it back.
		expect(memberPhotoUrl({ userId: "sub-of-claire", avatarUrl: null })).toBeNull();
		expect(memberPhotoUrl({ userId: "sub-of-claire", avatarUrl: "" })).toBeNull();
	});

	it("accepts an absolute URL on the Canari origin", () => {
		expect(memberPhotoUrl({ avatarUrl: FROM_CANARI })).toBe(FROM_CANARI);
	});

	it("refuses any other origin, protocol-relative included, and says so", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(memberPhotoUrl({ avatarUrl: "https://elsewhere.example/a.png" })).toBeNull();
		expect(memberPhotoUrl({ avatarUrl: "//elsewhere.example/a.png" })).toBeNull();
		expect(memberPhotoUrl({ avatarUrl: "javascript:alert(1)" })).toBeNull();
		expect(warn).toHaveBeenCalledTimes(3);
		expect(warn.mock.calls[0][0]).toContain("[MEMBER_PHOTO]");
	});
});

describe("MemberCard", () => {
	const src = (member: CanariMember) =>
		render(MemberCard, { member }).container.querySelector("img")?.getAttribute("src");

	it("loads today's photo through the legacy proxy", () => {
		expect(src(MEMBER_TODAY)).toBe(LEGACY);
	});

	it("loads the photo from Canari once avatarUrl is served, userId or not", () => {
		expect(src(MEMBER_ROLLOUT)).toBe(FROM_CANARI);
		expect(src(MEMBER_STRIPPED)).toBe(FROM_CANARI);
	});

	it("falls back to initials when the photo does not load (Canari answers 404 for no photo)", async () => {
		const { container, getByText } = render(MemberCard, { member: MEMBER_STRIPPED });
		await fireEvent.error(container.querySelector("img")!);
		expect(container.querySelector("img")).toBeNull();
		expect(getByText("CV")).toBeInTheDocument();
	});

	it("draws initials and requests nothing when there is no photo at all", () => {
		const { container, getByText } = render(MemberCard, {
			member: { ...BASE, avatarUrl: null } as CanariMember,
		});
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

	/** Card photos, i.e. every `<img>` (the fixture association has no logo). */
	const photos = (cards: Partial<PublishedCarteCard>[]) =>
		[
			...render(CarteVieAsso, {
				carte: carteWith(cards),
				associations: [ASSO],
			}).container.querySelectorAll("img"),
		].map((img) => img.getAttribute("src"));

	it("renders today's cards through the legacy proxy, two cards sharing an account id included", () => {
		// Keyed on `userId`, the same person on two cards was a duplicate-key error that took the map down.
		expect(photos([{ userId: "sub-of-claire" }, { userId: "sub-of-claire" }])).toEqual([
			LEGACY,
			LEGACY,
		]);
	});

	it("prefers avatarUrl during the rollout, and draws initials where Canari answers null", () => {
		expect(
			photos([
				{ userId: "sub-of-claire", avatarUrl: AVATAR_PATH },
				{ userId: "sub-of-someone-who-left", avatarUrl: null },
			])
		).toEqual([FROM_CANARI]);
	});

	it("needs no userId once Canari strips it, for the photo or the key", () => {
		expect(photos([{ avatarUrl: AVATAR_PATH }, { avatarUrl: AVATAR_PATH }])).toEqual([
			FROM_CANARI,
			FROM_CANARI,
		]);
	});
});
