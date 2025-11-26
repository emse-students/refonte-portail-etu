import { describe, it, expect } from "vitest";
import { of } from "$lib/utils";

describe("Utils", () => {
	describe("of", () => {
		it("should return d' for vowels", () => {
			expect(of("Association")).toBe("d'");
			expect(of("Ecole")).toBe("d'");
			expect(of("Ici")).toBe("d'");
			expect(of("Ours")).toBe("d'");
			expect(of("Usine")).toBe("d'");
			expect(of("Yoyo")).toBe("d'");
		});

		it("should return de for consonants", () => {
			expect(of("Bureau")).toBe("de ");
			expect(of("Club")).toBe("de ");
			expect(of("Maison")).toBe("de ");
			expect(of("Zèbre")).toBe("de ");
		});

		it("should handle lowercase", () => {
			expect(of("association")).toBe("d'");
			expect(of("bureau")).toBe("de ");
		});
	});
});
