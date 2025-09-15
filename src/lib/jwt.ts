import { SignJWT, jwtVerify } from 'jose';
import { type Cookies } from '@sveltejs/kit';
import { env } from 'bun';

const day = 24 * 60 * 60;

export type JwtPayload = { sub?: string } & Record<string, unknown>;


function getJwtSecret() {
    const key = env.JWT_SECRET;
    if (!key) {
        throw new Error('JWT_SECRET is not defined');
    }

    return new TextEncoder().encode(key);
}

export async function setJwt(cookies: Cookies, tokenData: Record<string, unknown>) {
    const jwt = await new SignJWT(tokenData)
        .setProtectedHeader({ alg: 'HS512' })
        .setIssuedAt()
        .setExpirationTime(`${day}s`)
        .sign(getJwtSecret());

    cookies.set('jwt', jwt, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        expires: new Date(Date.now() + day * 1000)
    });
}


export async function verifyJwt(token: string | undefined) {
    if (!token) {
        return null;
    }
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as JwtPayload;
    } catch {
        return null;
    }
}

export function setUserDataCookie(cookies: Cookies, userData: Record<string, unknown>) {
    cookies.set('userData', JSON.stringify(userData), {
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        path: '/',
        expires: new Date(Date.now() + day * 1000)
    });
}

export function getUserData(cookies: Cookies) {
    const userData = cookies.get('userData');
    if (!userData) {
        return null;
    }
    try {
        return JSON.parse(userData);
    } catch {
        return null;
    }
}

export function clearAuthCookies(cookies: Cookies) {
    cookies.delete('jwt', { path: '/' });
    cookies.delete('userData', { path: '/' });
}