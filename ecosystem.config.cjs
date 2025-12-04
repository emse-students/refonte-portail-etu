module.exports = {
	apps: [
		{
			name: "portail-etu",
			script: "build/index.js",
			interpreter: "bun",
			env: {
				PORT: 3000,
				ORIGIN: "https://portail-etu.emse.fr",
				BODY_SIZE_LIMIT: "10485760", // 10MB
			},
		},
	],
};
