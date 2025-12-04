module.exports = {
	apps: [
		{
			name: "portail-etu",
			script: "bun",
			args: "./build/index.js",
			interpreter: "none",
			env: {
				PORT: 3000,
				ORIGIN: "https://portail-etu.emse.fr",
				BODY_SIZE_LIMIT: "10485760", // 10MB
			},
		},
	],
};
