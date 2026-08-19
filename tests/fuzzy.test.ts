import { describe, expect, it } from "vitest";
import { editDistance, fuzzyRank, fuzzyScore, normalizeForSearch } from "$lib/search/fuzzy";

/**
 * The ecosystem search contract, pinned in this repository's own code. The numbers, the measurement
 * that produced them and what every other repository owes are in the canari repository at
 * `docs/wiki/search-contract.md`. A contract nothing executes is a comment, which is how four
 * implementations of the same promise drifted apart in the first place.
 */
describe("normalizeForSearch", () => {
	it("folds case and accents, so a name is found without them", () => {
		expect(normalizeForSearch("Élèves Ingénieurs")).toBe("eleves ingenieurs");
	});

	it("turns punctuation into a separator rather than deleting it", () => {
		expect(normalizeForSearch("Arts-Sciences")).toBe("arts sciences");
	});
});

describe("editDistance", () => {
	it("charges a swap of two adjacent letters as one edit, not two", () => {
		expect(editDistance("rboot", "robot")).toBe(1);
		expect(editDistance("sceince", "science")).toBe(1);
	});

	it("counts the usual edits", () => {
		expect(editDistance("robot", "robot")).toBe(0);
		expect(editDistance("robo", "robot")).toBe(1);
		expect(editDistance("robott", "robot")).toBe(1);
		expect(editDistance("rabot", "robot")).toBe(1);
		expect(editDistance("rabet", "robot")).toBe(2);
	});
});

describe("fuzzyScore", () => {
	it("matches whatever order the words were typed in", () => {
		expect(fuzzyScore("sciences arts", "Arts Sciences")).toBe(
			fuzzyScore("arts sciences", "Arts Sciences")!
		);
	});

	it("forgives a typo in a name the reader can see on the screen", () => {
		expect(fuzzyScore("sceince", "Club Science")).not.toBeNull();
		expect(fuzzyScore("rboot", "Club Robot")).not.toBeNull();
	});

	it("refuses a query whose every word does not land somewhere", () => {
		// A query is a conjunction: answering with the entry that matches half of it is how a
		// directory offers the wrong association.
		expect(fuzzyScore("club robot", "Club Science")).toBeNull();
	});

	it("gives a word of three letters no tolerance at all", () => {
		// Three letters and one edit would match most of a directory, which is the same as not
		// filtering. A three-letter PREFIX still matches, and that is the useful case.
		expect(fuzzyScore("bde", "BDE")).not.toBeNull();
		expect(fuzzyScore("clu", "Club Robot")).not.toBeNull();
		expect(fuzzyScore("bda", "BDE")).toBeNull();
	});

	it("gives a seven-letter word one edit and no more", () => {
		// The measured rung: a second edit below eight characters recovers no typo the first does
		// not - a single wrong keystroke is one edit by construction - and only adds a wrong answer.
		expect(fuzzyScore("sceince", "Club Science")).not.toBeNull();
		expect(fuzzyScore("scaonce", "Club Science")).toBeNull();
	});

	it("gives a word of eight letters or more its second edit", () => {
		expect(fuzzyScore("robatiqe", "Club Robotique")).not.toBeNull();
	});

	it("takes the tolerance from the SHORTER of the two words", () => {
		// Seven letters against nine, two edits apart: read off the candidate this would be within
		// tolerance and match, and that is how a short query ends up matching most of a directory.
		expect(fuzzyScore("roboiqu", "Club Robotique")).toBeNull();
	});

	it("has nothing to say about an empty query", () => {
		expect(fuzzyScore("", "Club Robot")).toBeNull();
		expect(fuzzyScore("   ", "Club Robot")).toBeNull();
	});
});

describe("fuzzyRank", () => {
	type Asso = { name: string; description: string };

	const ASSOS: Asso[] = [
		{ name: "BDE", description: "Le bureau des eleves." },
		{ name: "BDA", description: "Le bureau des arts." },
		{ name: "Club Robotique", description: "On construit des robots." },
		{ name: "Club Science", description: "Vulgarisation et experiences." },
		{ name: "Junior Entreprise", description: "Des missions pour le club robotique." },
	];

	const rank = (query: string): string[] =>
		fuzzyRank(
			query,
			ASSOS,
			(a) => a.name,
			(a) => a.description
		).map((a) => a.name);

	it("leaves the list untouched when nothing was typed", () => {
		expect(rank("")).toEqual(ASSOS.map((a) => a.name));
		expect(rank("   ")).toEqual(ASSOS.map((a) => a.name));
	});

	it("ranks the two namesakes ahead of the description match, shortest name first", () => {
		// Both clubs match "club" exactly and account for half their name, so they score the same;
		// what orders them is the length tiebreak, and what puts Junior Entreprise last is that
		// only its prose mentions a club.
		expect(rank("club")).toEqual(["Club Science", "Club Robotique", "Junior Entreprise"]);
	});

	it("finds an association through a typo the old substring filter refused", () => {
		expect(rank("rbootique")).toEqual(["Club Robotique"]);
	});

	it("ranks a name match above a description match", () => {
		// "Junior Entreprise" only mentions the robotics club in its prose, so it comes last.
		expect(rank("robotique")).toEqual(["Club Robotique", "Junior Entreprise"]);
	});

	it("matches prose by substring only, never by edit distance", () => {
		// A paragraph long enough contains a word within one edit of almost any query, so a
		// tolerance over prose is a match on everything rather than a tolerant match.
		expect(rank("robotiqe")).toEqual(["Club Robotique"]);
	});

	it("answers the same order every time it is asked", () => {
		// A list that reorders itself between two keystrokes makes the reader click the wrong tile.
		expect(rank("club")).toEqual(rank("club"));
		expect(
			fuzzyRank(
				"club",
				[...ASSOS].reverse(),
				(a) => a.name,
				(a) => a.description
			).map((a) => a.name)
		).toEqual(rank("club"));
	});
});
