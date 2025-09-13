// login using CAS

import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
    if (locals.user) {
        return redirect(302, '/');
    }

    // redirect to cas login
    const service = url.origin + '/login/callback';
    const casLoginUrl = 'https://cas.emse.fr/cas/login?service=' + encodeURIComponent(service);
    throw redirect(302, casLoginUrl);
}

