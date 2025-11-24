import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		ignores: ["build/", ".svelte-kit/", "dist/", "node_modules/", "*.config.*"],
	},
	{
		files: ["**/*.js", "**/*.ts"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			parser: tsParser,
			parserOptions: {
				extraFileExtensions: [".svelte"],
			},
			globals: {
				...globals.browser,
				...globals.es2017,
				...globals.node,
			},
		},
		plugins: {
			"@typescript-eslint": ts,
		},
		rules: {
			...ts.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: [".svelte"],
			},
			globals: {
				...globals.browser,
				...globals.es2017,
			},
		},
		plugins: {
			svelte,
			"@typescript-eslint": ts,
		},
		rules: {
			...svelte.configs.recommended.rules,
			...ts.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"svelte/no-at-html-tags": "warn",
		},
	},
	prettier,
];
