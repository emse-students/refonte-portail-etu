import { SvelteKitAuth } from "@auth/sveltekit";
import 'dotenv/config';

export const { handle } = SvelteKitAuth({
	providers: [
		{
			id: "cas-emse", // signIn("my-provider") and will be part of the callback URL
			name: "CAS EMSE", // optional, used on the default login page as the button text.
			type: "oidc", // or "oauth" for OAuth 2 providers
			issuer: "https://cas.emse.fr/cas/oidc", // to infer the .well-known/openid-configuration URL
			clientId: process.env.AUTH_CLIENT_ID, // from the provider's dashboard
			clientSecret: process.env.AUTH_CLIENT_SECRET, // from the provider's dashboard
			authorization: {
				scope: "openid profile email",
			},
		},
	],
	trustHost: process.env.AUTH_TRUSTED_HOST === 'true',
	secret: process.env.AUTH_SECRET,
	basePath: '/dev/auth'
});
