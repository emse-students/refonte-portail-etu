import { env } from '$env/dynamic/private';
import type { FullUser } from '$lib/databasetypes';
import type { RequestEvent } from '@sveltejs/kit';
import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const SESSION_COOKIE_NAME = 'user_session';
const SESSION_SECRET = env.AUTH_SECRET || 'default-secret-change-me';
const ENCRYPTION_KEY = Buffer.from(SESSION_SECRET.padEnd(32, '0').slice(0, 32)); // 256-bit key
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours en secondes

/**
 * Sérialise et chiffre les données utilisateur
 */
function encryptData(data: FullUser): string {
	const iv = randomBytes(16);
	const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
	
	const jsonData = JSON.stringify(data);
	let encrypted = cipher.update(jsonData, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	
	// Retourner IV + données chiffrées
	return iv.toString('hex') + ':' + encrypted;
}

/**
 * Déchiffre et désérialise les données utilisateur
 */
function decryptData(encryptedData: string): FullUser | null {
	try {
		const [ivHex, encrypted] = encryptedData.split(':');
		if (!ivHex || !encrypted) return null;
		
		const iv = Buffer.from(ivHex, 'hex');
		const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
		
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		
		return JSON.parse(decrypted) as FullUser;
	} catch (error) {
		console.error('Erreur lors du déchiffrement des données de session:', error);
		return null;
	}
}

/**
 * Génère une signature HMAC pour vérifier l'intégrité
 */
function signData(data: string): string {
	return createHmac('sha256', SESSION_SECRET)
		.update(data)
		.digest('hex');
}

/**
 * Vérifie la signature HMAC
 */
function verifySignature(data: string, signature: string): boolean {
	const expectedSignature = signData(data);
	return signature === expectedSignature;
}

/**
 * Crée un cookie de session sécurisé avec les données utilisateur
 */
export function createUserSession(userData: FullUser): string {
	const encrypted = encryptData(userData);
	const signature = signData(encrypted);
	
	// Format: encrypted_data.signature
	return `${encrypted}.${signature}`;
}

/**
 * Lit et vérifie le cookie de session
 */
export function readUserSession(cookieValue: string): FullUser | null {
	if (!cookieValue) return null;
	
	const lastDotIndex = cookieValue.lastIndexOf('.');
	if (lastDotIndex === -1) return null;
	
	const encrypted = cookieValue.substring(0, lastDotIndex);
	const signature = cookieValue.substring(lastDotIndex + 1);
	
	// Vérifier la signature
	if (!verifySignature(encrypted, signature)) {
		console.warn('Signature de session invalide');
		return null;
	}
	
	// Déchiffrer les données
	return decryptData(encrypted);
}

/**
 * Configure le cookie de session dans la réponse
 */
export function setSessionCookie(event: RequestEvent, userData: FullUser): void {
	const sessionValue = createUserSession(userData);
	
	console.log('[setSessionCookie] Setting cookie:', {
		name: SESSION_COOKIE_NAME,
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE,
		valueLength: sessionValue.length
	});
	
	event.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE
	});
	
	console.log('[setSessionCookie] Cookie set complete');
}

/**
 * Récupère les données utilisateur depuis le cookie de session
 */
export function getSessionData(event: RequestEvent): FullUser | null {
	const cookieValue = event.cookies.get(SESSION_COOKIE_NAME);
	if (!cookieValue) return null;
	
	return readUserSession(cookieValue);
}

/**
 * Supprime le cookie de session
 */
export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Met à jour le cookie de session avec de nouvelles données
 */
export function updateSessionData(event: RequestEvent, userData: FullUser): void {
	setSessionCookie(event, userData);
}
