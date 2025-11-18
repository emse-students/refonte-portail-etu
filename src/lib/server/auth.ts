import { SvelteKitAuth } from "@auth/sveltekit";
import { env } from '$env/dynamic/private';

export const { handle } = SvelteKitAuth({
	providers: [
		{
			id: "cas-emse", // signIn("my-provider") and will be part of the callback URL
			name: "CAS EMSE", // optional, used on the default login page as the button text.
			type: "oidc", // or "oauth" for OAuth 2 providers
			issuer: "https://cas.emse.fr/cas/oidc", // to infer the .well-known/openid-configuration URL
			clientId: env.AUTH_CLIENT_ID, // from the provider's dashboard
			clientSecret: env.AUTH_CLIENT_SECRET, // from the provider's dashboard
			authorization: {
				scope: "openid profile email",
			},
			
		},
	],
	trustHost: env.AUTH_TRUSTED_HOST === 'true',
	secret: env.AUTH_SECRET,
	callbacks: {
		async jwt({ token, user }) {

			console.log("AUTH/JWT :", user)
			// First time jwt callback is run, user object is available
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
			}
			return token;
		},
		async session({ session, token }) {

			console.log("AUTH/SESSION :", token);

			// Attach the user id from token to the session
			if (token) {
				session.user.id = token.sub as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
			}
			return session;
		}
	}
});
