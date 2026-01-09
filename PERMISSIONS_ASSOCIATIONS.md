# Système de Permissions par Association

## Vue d'ensemble

Le système de permissions a été étendu pour gérer les permissions au niveau des associations. Les utilisateurs peuvent avoir des permissions globales (ADMIN, SITE_ADMIN) ou des permissions spécifiques à certaines associations via leurs memberships.

## Architecture

### Types de Permissions

1. **Permissions Globales** (dans `user.permissions`)
   - `ADMIN` (1 << 3) : Accès à toutes les fonctionnalités admin
   - `SITE_ADMIN` (1 << 4) : Gestion complète du site

2. **Permissions d'Association** (dans `role.permissions` via `member`)
   - `ROLES` (1 << 0) : Gestion des rôles
   - `MEMBERS` (1 << 1) : Gestion des membres
   - `EVENTS` (1 << 2) : Gestion des événements

### Structure des Données

```typescript
interface AuthenticatedUser extends RawUser {
	permissions: number; // Permissions globales
	memberships?: Member[]; // Memberships avec permissions par association
}

interface Member {
	id: number;
	user: User;
	role: Role; // Le rôle contient les permissions pour cette association
	association: number; // ID de l'association
	visible: boolean;
}
```

## Fonctions Utilitaires

### `hasAssociationPermission(user, associationId, permission)`

Vérifie si un utilisateur a une permission pour une association spécifique.

**Comportement :**

- Les admins globaux (ADMIN, SITE_ADMIN) ont toutes les permissions
- Sinon, vérifie les memberships de l'utilisateur pour l'association donnée
- Retourne `true` si l'utilisateur a le membership avec la permission requise

### `checkAssociationPermission(event, associationId, permission)`

Middleware pour vérifier l'authentification et les permissions d'association.

**Retour :**

```typescript
{ authorized: true, user: AuthenticatedUser }
// ou
{ authorized: false, response: Response }
```

### `getAuthorizedAssociationIds(user, permission)`

Récupère la liste des IDs d'associations pour lesquelles l'utilisateur a une permission.

**Retour :**

- `null` si l'utilisateur est admin global (= accès à toutes les associations)
- `number[]` liste des IDs d'associations autorisées
- `[]` si aucune association autorisée

## Implémentation dans les API

### API Events (`/api/events`)

#### GET

- Route publique par défaut
- Avec `?editable=true` : filtre les événements selon les associations où l'utilisateur a la permission `EVENTS`

#### POST

- Vérifie que l'utilisateur a `EVENTS` pour l'`association_id` spécifiée
- Empêche la création d'événements pour des associations non autorisées

#### PUT

- Vérifie `EVENTS` pour l'association actuelle de l'événement
- Si changement d'association : vérifie aussi `EVENTS` pour la nouvelle association
- Empêche le déplacement d'événements vers des associations non autorisées

#### DELETE

- Vérifie `EVENTS` pour l'association de l'événement à supprimer

### API Members (`/api/members`)

#### GET

- Filtre automatiquement selon les associations où l'utilisateur a `MEMBERS`
- Les admins voient tous les membres

#### POST

- Vérifie que l'utilisateur a `MEMBERS` pour l'`association_id` spécifiée

#### PUT

- Vérifie `MEMBERS` pour l'association actuelle du membre
- Si changement d'association : vérifie aussi `MEMBERS` pour la nouvelle association

#### DELETE

- Vérifie `MEMBERS` pour l'association du membre à supprimer

## Chargement des Données

Le fichier `hooks.server.ts` charge automatiquement les memberships de l'utilisateur :

```typescript
const response = await event.fetch(`/api/users/${userId}?fullUser=true`);
const data = await response.json();
const userData: FullUser = data.user; // Inclut memberships
event.locals.userData = userData;
```

Cela permet d'avoir toutes les informations nécessaires en cache pour vérifier les permissions sans requêtes supplémentaires.

## Exemple d'Utilisation

### Créer un événement

```typescript
// L'utilisateur doit avoir la permission EVENTS pour l'association 5
POST /api/events
{
  "association_id": 5,
  "title": "Mon événement",
  "description": "...",
  "start_date": "2025-01-01",
  "end_date": "2025-01-02",
  "location": "Campus"
}
```

**Vérifications :**

1. L'utilisateur est-il authentifié ?
2. A-t-il ADMIN ou SITE_ADMIN ? → OK
3. Sinon, a-t-il un membership dans l'association 5 avec permission EVENTS ? → OK ou 403

### Obtenir ses événements éditables

```typescript
GET /api/events?editable=true
```

**Comportement :**

- Admin global → tous les événements
- Sinon → uniquement les événements des associations où l'utilisateur a EVENTS

## Notes Importantes

1. **Admins Globaux** : Les utilisateurs avec `ADMIN` ou `SITE_ADMIN` outrepassent toutes les restrictions d'association
2. **Validation** : Toutes les routes vérifient l'existence de l'entité avant de vérifier les permissions
3. **Changement d'association** : Lors de la modification (PUT), si l'association change, les deux associations doivent être autorisées
4. **Filtrage automatique** : Les routes GET filtrent automatiquement selon les permissions de l'utilisateur
