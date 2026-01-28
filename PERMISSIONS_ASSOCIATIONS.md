# Système de Permissions par Association (Mis à jour)

## Vue d'ensemble

Le système de permissions a été étendu pour gérer les permissions au niveau des associations. Les utilisateurs peuvent avoir des permissions globales (ADMIN, SITE_ADMIN) ou des permissions spécifiques à certaines associations via leurs memberships.

## Architecture

### Types de Permissions

Le système utilise une hiérarchie de permissions basée sur des niveaux (Enum `Permission`).
La vérification se fait par niveau : un utilisateur possédant un niveau N a automatiquement accès aux fonctionnalités de niveau N et inférieur (`>=`).

**Niveaux définis :**

- `MEMBER` (0) : Membre simple (accès de base, lecture seule)
- `MANAGE` (1) : Gestion des membres et des événements
- `ADMIN` (2) : Administration complète de l'association (accès à toutes les ressources)
- `SITE_ADMIN` (3) : Super Administrateur (accès à tout le site, outrepasse toutes les permissions)

### Logique d'Autorisation

1. **Permissions Globales**
   - Stockées dans `user.permissions`.
   - Si un utilisateur a une permission globale suffisante (ex: `SITE_ADMIN`), il a accès à **toutes** les associations et listes.

2. **Permissions d'Association / Liste**
   - Stockées directement dans `member.permissions` via les memberships (`user.memberships`).
   - S'appliquent uniquement à l'association ou la liste spécifique.
   - Un utilisateur peut avoir le niveau `ADMIN` (3) dans l'association A, mais seulement `MEMBER` (0) dans l'association B.

### Structure des Données

```typescript
interface AuthenticatedUser extends RawUser {
	permissions: number; // Permissions globales
	memberships?: Member[]; // Memberships avec permissions par association
}

interface Member {
	id: number;
	user: User;
	role_name: string; // Ex: "Président", "Trésorier", "Membre"
	permissions: number; // Niveau de permission (0-3)
	hierarchy: number; // Niveau hiérarchique pour l'affichage (0-10)
	association_id: number | null; // ID de l'association si applicable
	list_id: number | null; // ID de la liste si applicable
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

- Filtre automatiquement selon les associations où l'utilisateur a `MANAGE`
- Les admins voient tous les membres

#### POST

- Vérifie que l'utilisateur a `MANAGE` pour l'`association_id` spécifiée

#### PUT

- Vérifie `MANAGE` pour l'association actuelle du membre
- Si changement d'association : vérifie aussi `MANAGE` pour la nouvelle association

#### DELETE

- Vérifie `MANAGE` pour l'association du membre à supprimer

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
