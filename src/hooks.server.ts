import type { Handle } from '@sveltejs/kit';
import { verifyJwt, getUserData } from '$lib/jwt';


const protectedRoutes = ['/dashboard', '/profile'];

export const handle: Handle = async ({ event, resolve }) => {
    const jwt = await verifyJwt(event.cookies.get('jwt'));
    const userData = getUserData(event.cookies);
    event.locals.token = jwt;
    event.locals.user = userData;

    const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));
    if (isProtectedRoute && !event.locals?.token?.sub) {
        return Response.redirect('/login', 303);
    }

    if (event.url.pathname === '/login' && event.locals?.token?.sub) {
        return Response.redirect('/', 303);
    }

    return resolve(event);
}