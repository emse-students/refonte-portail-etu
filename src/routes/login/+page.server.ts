// login using CAS

import { setJwt, setUserDataCookie } from '$lib/jwt.js';

import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ url, cookies }) => {
    const user = {
        id: 1,
        username: 'testuser'
    };

    const jwt = await setJwt(cookies, user);
    setUserDataCookie(cookies, user);

    redirect(302, '/');



    // redirect to cas login
    const service = url.origin + '/login/callback';
    const casLoginUrl = 'https://cas.emse.fr/cas/login?service=' + encodeURIComponent(service);
    throw redirect(302, casLoginUrl);
}

