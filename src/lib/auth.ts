import { SvelteKitAuth } from "@auth/sveltekit";
import { env } from "bun";

export const { handle } = SvelteKitAuth({
	providers: [
		{
			id: "cas-emse", // signIn("my-provider") and will be part of the callback URL
			name: "CAS EMSE", // optional, used on the default login page as the button text.
			type: "oidc", // or "oauth" for OAuth 2 providers
			issuer: "https://cas-test.emse.fr/cas/oidc", // to infer the .well-known/openid-configuration URL
			clientId: env.AUTH_CLIENT_ID, // from the provider's dashboard
			clientSecret: env.AUTH_CLIENT_SECRET, // from the provider's dashboard
			authorization: {
				scope: "openid profile email",
			},
		},
	],
});
