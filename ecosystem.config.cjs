module.exports = {
	apps: [
		{
			name: "portail-etu",
			script: "bun",
			args: "./build/index.js",
			interpreter: "none",
			// Prefix every log line with a timestamp. Without this, 479 recorded
			// avatar-proxy connection failures could not be placed in time at all,
			// which is the one thing that separates an outage window from a
			// permanent fault - the log is the only telemetry this host exposes.
			time: true,
			env: {
				PORT: 3000,
				ORIGIN: "https://portail-etu.emse.fr",
				BODY_SIZE_LIMIT: "10485760", // 10MB
			},
		},
	],
};
