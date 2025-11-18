# Exemples d'utilisation du système de session

## 1. Endpoint API basique avec authentification

```typescript
// src/routes/api/example/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth, unauthorizedResponse } from '$lib/server/auth-middleware';

export const GET = async (event: RequestEvent) => {
  // Récupérer l'utilisateur authentifié (depuis le cookie de session)
  const user = await requireAuth(event);
  
  if (!user) {
    return unauthorizedResponse();
  }
  
  // Utiliser les données utilisateur
  return json({
    message: `Bonjour ${user.first_name} ${user.last_name}`,
    memberships: user.memberships.length
  });
};
```

## 2. Vérifier les permissions

```typescript
// src/routes/api/admin/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { checkPermission } from '$lib/server/auth-middleware';
import Permission from '$lib/permissions';

export const POST = async (event: RequestEvent) => {
  // Vérifier que l'utilisateur a la permission ADMIN
  const authCheck = await checkPermission(event, Permission.ADMIN);
  
  if (!authCheck.authorized) {
    return authCheck.response; // Retourne 401 ou 403 automatiquement
  }
  
  // L'utilisateur est autorisé
  const user = authCheck.user;
  
  // Faire l'opération admin
  return json({ success: true });
};
```

## 3. Vérifier les permissions d'association

```typescript
// src/routes/api/associations/[id]/members/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { checkAssociationPermission } from '$lib/server/auth-middleware';
import Permission from '$lib/permissions';

export const POST = async (event: RequestEvent) => {
  const associationId = parseInt(event.params.id || '0');
  
  // Vérifier que l'utilisateur a MANAGE_MEMBERS pour cette association
  const authCheck = await checkAssociationPermission(
    event, 
    associationId, 
    Permission.MANAGE_MEMBERS
  );
  
  if (!authCheck.authorized) {
    return authCheck.response;
  }
  
  // Ajouter un membre
  return json({ success: true });
};
```

## 4. Forcer le rafraîchissement après modification

```typescript
// src/routes/api/users/[id]/roles/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth-middleware';
import { clearSessionCookie } from '$lib/server/session';
import db from '$lib/server/database';

export const PUT = async (event: RequestEvent) => {
  const user = await requireAuth(event);
  if (!user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  const userId = parseInt(event.params.id || '0');
  
  // Modifier les rôles de l'utilisateur
  await db`UPDATE member SET role_id = ${newRoleId} WHERE user_id = ${userId}`;
  
  // Si c'est l'utilisateur actuel, invalider sa session
  // pour forcer le rechargement de ses nouvelles permissions
  if (userId === user.id) {
    clearSessionCookie(event);
  }
  
  return json({ success: true, message: 'Rôle modifié. Rechargez la page.' });
};
```

## 5. Page serveur avec données utilisateur

```typescript
// src/routes/profile/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // Les données utilisateur sont déjà disponibles dans locals
  if (!locals.userData) {
    throw redirect(302, '/login');
  }
  
  return {
    user: locals.userData
  };
};
```

## 6. Middleware personnalisé

```typescript
// src/routes/api/associations/[id]/events/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth, hasAssociationPermission } from '$lib/server/auth-middleware';
import Permission from '$lib/permissions';

export const GET = async (event: RequestEvent) => {
  const user = await requireAuth(event);
  const associationId = parseInt(event.params.id || '0');
  
  // Logique personnalisée : afficher tous les événements pour les admins,
  // seulement les événements publics pour les autres
  let events;
  
  if (user && hasAssociationPermission(user, associationId, Permission.MANAGE_EVENTS)) {
    // Membre avec droits : voir tous les événements
    events = await db`SELECT * FROM event WHERE association_id = ${associationId}`;
  } else {
    // Public : voir seulement les événements publiés
    events = await db`SELECT * FROM event WHERE association_id = ${associationId} AND published = true`;
  }
  
  return json({ events });
};
```

## 7. Déconnexion côté client

```typescript
// Dans un composant Svelte
async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST'
  });
  
  if (response.ok) {
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }
}
```

## 8. Rafraîchissement de session côté client

```typescript
// Après modification du profil
async function updateProfile(data) {
  const response = await fetch('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    // Forcer le rafraîchissement de la session
    await fetch('/api/auth/refresh', { method: 'POST' });
    
    // Recharger la page pour obtenir les nouvelles données
    window.location.reload();
  }
}
```

## 9. Vérification de cohérence

```typescript
// Dans un hook ou middleware
import { verifySessionConsistency } from '$lib/server/auth-middleware';

export const handle = async ({ event, resolve }) => {
  // ... votre code ...
  
  // Optionnel : vérifier la cohérence
  const isConsistent = verifySessionConsistency(event);
  if (!isConsistent) {
    console.warn('Incohérence détectée entre session Auth.js et userData');
  }
  
  return resolve(event);
};
```

## 10. Récupérer les associations autorisées

```typescript
// src/routes/api/my-associations/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth, getAuthorizedAssociationIds } from '$lib/server/auth-middleware';
import Permission from '$lib/permissions';
import db from '$lib/server/database';

export const GET = async (event: RequestEvent) => {
  const user = await requireAuth(event);
  if (!user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  // Récupérer les IDs des associations que l'utilisateur peut gérer
  const authorizedIds = getAuthorizedAssociationIds(user, Permission.MANAGE_ASSOCIATION);
  
  let associations;
  if (authorizedIds === null) {
    // Admin global : toutes les associations
    associations = await db`SELECT * FROM association`;
  } else if (authorizedIds.length === 0) {
    // Aucune association autorisée
    associations = [];
  } else {
    // Associations spécifiques
    associations = await db`SELECT * FROM association WHERE id IN (${authorizedIds})`;
  }
  
  return json({ associations });
};
```

## Notes importantes

### Performance

- Les données sont chargées **une seule fois** depuis la DB (à la connexion)
- Les requêtes suivantes lisent directement le cookie (très rapide)
- Aucun appel DB supplémentaire pour chaque requête

### Sécurité

- Cookie HttpOnly (non accessible en JavaScript côté client)
- Chiffrement AES-256-CBC
- Signature HMAC pour détecter les modifications
- SameSite=lax pour protection CSRF basique

### Invalidation

- Le cookie expire après 7 jours
- Appelez `clearSessionCookie()` pour forcer la déconnexion
- Les modifications de permissions nécessitent un refresh manuel

### Debug

```typescript
// Voir les données utilisateur dans la console serveur
console.log('User data:', event.locals.userData);
console.log('Session:', event.locals.session);
```
