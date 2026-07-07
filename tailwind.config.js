/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", "Roboto", "sans-serif"],
				heading: ['"Glass Antiqua"', "serif"],
				mono: ['"Fira Mono"', "monospace"],
			},
			colors: {
				mines: {
					navy: "#1b263b",
					"navy-light": "#415a77",
					"navy-dark": "#0d1b2a",
					gold: "#e09f3e",
					grey: "#778da9",
					platinum: "#e0e1dd",
				},
				glass: {
					100: "rgba(255, 255, 255, 0.1)",
					200: "rgba(255, 255, 255, 0.2)",
					300: "rgba(255, 255, 255, 0.3)",
					dark: "rgba(27, 38, 59, 0.6)",
				},
			},
			backgroundImage: {
				"glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))",
			},
		},
	},
	plugins: [],
};
