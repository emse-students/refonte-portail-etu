# Système de Session Sécurisé

## Vue d'ensemble

Le portail étudiant utilise un système de session avec cookies sécurisés pour stocker les informations utilisateur et éviter de recharger ces données depuis la base de données à chaque requête.

## Architecture

### Composants principaux

1. **`src/lib/server/session.ts`** - Module de gestion des sessions
   - Chiffrement AES-256-CBC des données utilisateur
   - Signature HMAC pour vérifier l'intégrité
   - Gestion des cookies sécurisés

2. **`src/hooks.server.ts`** - Hook serveur principal
   - Vérifie l'authentification Auth.js
   - Charge les données utilisateur (avec cache de session)
   - Stocke les données dans `event.locals.userData`

3. **Routes API de session**
   - `/api/auth/logout` - Déconnexion (supprime le cookie)
   - `/api/auth/refresh` - Force le rafraîchissement de la session

## Fonctionnement

### Première connexion

1. L'utilisateur s'authentifie via Auth.js (CAS EMSE)
2. Le hook serveur récupère l'ID utilisateur depuis la session Auth.js
3. Les données utilisateur complètes (incluant les memberships) sont chargées depuis la DB
4. Ces données sont chiffrées et stockées dans un cookie sécurisé
5. Les données sont également mises en cache dans `event.locals.userData`

### Requêtes suivantes

1. Le hook serveur lit le cookie de session
2. Les données sont déchiffrées et vérifiées (signature)
3. Si valides, elles sont utilisées directement (pas d'appel DB)
4. Les données sont mises en cache dans `event.locals.userData`

### Sécurité du cookie

- **Nom** : `user_session`
- **Chiffrement** : AES-256-CBC avec IV aléatoire
- **Signature** : HMAC-SHA256
- **HttpOnly** : true (non accessible en JavaScript)
- **Secure** : true en production (HTTPS uniquement)
- **SameSite** : lax (protection CSRF)
- **Max-Age** : 7 jours

### Format du cookie

```
<IV_hex>:<données_chiffrées_hex>.<signature_hmac_hex>
```

Exemple :

```
a1b2c3d4e5f6...:<encrypted_data>.<hmac_signature>
```

## Utilisation dans le code

### Accéder aux données utilisateur

Dans n'importe quel endpoint serveur :

```typescript
import { requireAuth } from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
	const user = await requireAuth(event);

	if (!user) {
		return json({ error: "Non autorisé" }, { status: 401 });
	}

	// user contient toutes les données, incluant les memberships
	console.log(user.memberships);

	return json({ user });
};
```

### Forcer le rafraîchissement

Après modification des permissions ou du profil utilisateur :

```typescript
import { clearSessionCookie } from "$lib/server/session";

// Dans votre endpoint
clearSessionCookie(event);
// Les données seront rechargées depuis la DB au prochain hook
```

Ou via l'API :

```javascript
// Côté client
await fetch("/api/auth/refresh", { method: "POST" });
```

## Variables d'environnement

### Requises

- `AUTH_SECRET` - Secret utilisé pour chiffrer et signer les sessions
  - **Important** : Doit être une chaîne aléatoire sécurisée de 32+ caractères
  - Utilisé pour la clé de chiffrement AES-256 (32 octets)
  - Utilisé pour la signature HMAC

### Configuration

Dans `.env` :

```bash
AUTH_SECRET=votre-secret-tres-securise-de-32-caracteres-minimum
```

⚠️ **Sécurité** : Ne jamais commiter le fichier `.env` ou exposer `AUTH_SECRET`

## Performance

### Avant (avec appel API)

- ❌ Appel HTTP interne à chaque requête
- ❌ Requête SQL complexe avec JOINs à chaque requête
- ❌ Sérialisation/désérialisation JSON

### Après (avec cookie de session)

- ✅ Lecture du cookie uniquement (1ère requête uniquement pour charger DB)
- ✅ Déchiffrement rapide en mémoire
- ✅ Pas d'appel DB si cookie valide
- ✅ Réduction de la charge sur la base de données

## Invalidation de session

### Cas d'invalidation automatique

- Cookie expiré (> 7 jours)
- Signature invalide (données modifiées)
- ID utilisateur ne correspond pas à la session Auth.js
- Erreur de déchiffrement

### Invalidation manuelle

```typescript
// Déconnexion
await fetch("/api/auth/logout", { method: "POST" });

// Ou forcer le rafraîchissement
await fetch("/api/auth/refresh", { method: "POST" });
```

## Logs et debugging

Les logs sont disponibles dans la console serveur :

```
Handling request for: /api/...
Current locals before processing: { session: {...}, userData: {...} }
```

En cas d'erreur :

```
Erreur lors du chargement de userData: <erreur>
Signature de session invalide
Erreur lors du déchiffrement des données de session: <erreur>
```

## Maintenance

### Rotation du secret

Si vous devez changer `AUTH_SECRET` :

1. Tous les cookies existants deviendront invalides
2. Les utilisateurs devront se reconnecter
3. Les nouvelles sessions utiliseront le nouveau secret

### Migration

Pour migrer d'un système à l'autre, aucune action requise. Le système détectera automatiquement l'absence de cookie et rechargera les données depuis la DB.

## Développement

### Tests locaux

Le système fonctionne en développement avec des cookies non-sécurisés (HTTP) :

```typescript
secure: process.env.PROD === "true";
```

### Production

En production, assurez-vous que :

- `PROD=true` est défini
- Le site utilise HTTPS
- `AUTH_SECRET` est un secret fort et unique
