# Documentation de l'API

Ce document décrit les points de terminaison (endpoints) de l'API disponibles pour le Portail Étudiant.

## URL de base

Tous les points de terminaison de l'API sont préfixés par `/api`.

## Authentification

La plupart des points de terminaison nécessitent une authentification. Le système utilise une authentification basée sur les sessions.

## Points de Terminaison (Endpoints)

### Utilisateurs (Users)

#### `GET /api/users`

Récupère une liste de tous les utilisateurs.

- **Permissions** : `ADMIN` ou `SITE_ADMIN`
- **Réponse** : Tableau d'objets Utilisateur.
  ```json
  [
  	{
  		"id": 1,
  		"first_name": "John",
  		"last_name": "Doe",
  		"email": "john@example.com",
  		"login": "jdoe",
  		"promo": 2024,
  		"permissions": 0
  	}
  ]
  ```

#### `POST /api/users`

Crée un nouvel utilisateur.

- **Permissions** : `ADMIN` ou `SITE_ADMIN`
- **Corps (Body)** :
  ```json
  {
  	"first_name": "Jane",
  	"last_name": "Doe",
  	"email": "jane@example.com",
  	"login": "jane.doe",
  	"promo": 2025
  }
  ```

#### `DELETE /api/users`

Supprime un utilisateur.

- **Permissions** : `ADMIN` ou `SITE_ADMIN`
- **Corps (Body)** :
  ```json
  { "id": 1 }
  ```

#### `GET /api/users/[id]/roles`

Récupère les informations détaillées des rôles pour un utilisateur spécifique.

- **Permissions** : `ADMIN` ou `SITE_ADMIN`
- **Réponse** :
  ```json
  [
  	{
  		"role_name": "President",
  		"permissions": 2,
  		"association_name": "BDE",
  		"list_name": null
  	}
  ]
  ```

### Associations

#### `GET /api/associations`

Récupère une liste de toutes les associations.

- **Permissions** : Publique
- **Réponse** : Tableau d'objets Association de base.

#### `GET /api/associations/[id]`

Récupère les détails d'une association spécifique.

- **Paramètres de requête (Query Params)** :
  - `includeMembers` : `true` pour inclure la liste des membres.
- **Permissions** : Publique

#### `POST /api/associations`

Crée une nouvelle association.

- **Permissions** : `ADMIN` (Global)
- **Corps (Body)** : `{ name, description, handle, icon, color }`

#### `PUT /api/associations/[id]`

Met à jour une association.

- **Permissions** : `ADMIN` (Global) ou `ADMIN` de l'association
- **Corps (Body)** : `{ name, description, handle, icon, color }`

#### `DELETE /api/associations/[id]`

Supprime une association.

- **Permissions** : `ADMIN` (Global) ou `ADMIN` de l'association

### Configuration (Système)

#### `GET /api/config`

Récupère les paires clé-valeur de la configuration du système.

- **Permissions** : Authentifié
- **Réponse** :
  ```json
  {
  	"maintenance_mode": "false",
  	"global_announcement": "Bienvenue !",
  	"event_submission_open": "true"
  }
  ```

#### `POST /api/config`

Met à jour une valeur de configuration.

- **Permissions** : `ADMIN`, `SITE_ADMIN`, ou `EVENTS` (pour les clés liées aux événements)
- **Corps (Body)** :
  ```json
  {
  	"key": "maintenance_mode",
  	"value": "true"
  }
  ```

### Événements (Events)

#### `GET /api/events`

Récupère une liste d'événements.

- **Paramètres de requête (Query Params)** :
  - `editable` : `true` pour récupérer uniquement les événements que l'utilisateur peut modifier (nécessite Auth).
- **Permissions** : Publique (pour les événements validés), Authentifié (pour les filtres `editable=true`).
- **Réponse** : Tableau d'objets Événement.

#### `POST /api/events`

Crée un nouvel événement.

- **Permissions** : `EVENTS` (Global) ou permission `EVENTS` de l'association.
- **Note** : Si la config `event_submission_open` est fausse, seuls les gestionnaires globaux peuvent publier.
- **Corps (Body)** :
  ```json
  {
  	"association_id": 1,
  	"list_id": null,
  	"title": "Soirée",
  	"description": "...",
  	"start_date": "ISOString",
  	"end_date": "ISOString",
  	"location": "Foyer"
  }
  ```

#### `PUT /api/events`

Met à jour un événement.

- **Permissions** : `EVENTS` (Global) ou permission `EVENTS` de l'association.

### Listes (Lists)

#### `GET /api/lists`

Récupère les listes (par exemple, les listes BDE).

- **Permissions** : Publique
- **Réponse** : Tableau d'objets Liste.

#### `GET /api/lists/[id]`

Récupère les détails d'une liste spécifique.

- **Paramètres de requête (Query Params)** :
  - `includeMembers` : `true` pour inclure les membres.
- **Permissions** : Publique

#### `POST /api/lists`

Crée une nouvelle liste.

- **Permissions** : `ADMIN` ou `SITE_ADMIN`
- **Corps (Body)** : `{ name, handle, description, association_id, promo, ... }`

#### `PUT /api/lists/[id]`

Met à jour une liste.

- **Permissions** : `ADMIN` (Global) ou Propriétaire de la Liste/Association ?
- **Corps (Body)** : Mises à jour des champs.

#### `DELETE /api/lists/[id]`

Supprime une liste.

### Membres (Members)

#### `GET /api/members`

Récupère les membres des associations ou des listes.

#### `POST /api/members`

Ajoute un membre à une association ou une liste.

### Calendrier (Calendar)

#### `GET /api/calendar`

Récupère les événements du calendrier formatés pour l'affichage (ou ICS si implémenté).

- **Paramètres de requête (Query Params)** :
  - `start` : Date de début (AAAA-MM-JJ)
  - `end` : Date de fin (AAAA-MM-JJ)
  - `asso` : Filtrer par ID de l'association
  - `list` : Filtrer par ID de la liste
  - `unvalidated` : `true` pour inclure les événements non validés (nécessite des permissions)
  - `all` : `true` pour ignorer les autres filtres ? (Logique spécifique à l'implémentation)
- **Permissions** : Publique (par défaut), Authentifié (pour l'accès `unvalidated`).

### Images

Cette API agit comme un proxy vers un service de galerie externe appelé **Migallery** (Un autre projet technique pour l'hébergement d'images).

**Variables d'environnement requises :**

- `GALLERY_API_URL` : URL de base de l'instance Migallery.
- `GALLERY_API_KEY` : Clé API pour l'authentification partagée.
- `PORTAL_URL` : URL d'origine envoyée à Migallery.

#### `POST /api/image`

Upload une image vers le service Migallery.
Effectue un redimensionnement/recadrage automatique en JPEG 800x800px en utilisant `jimp` avant l'envoi.

- **Permissions** : `ADMIN` (Global) ou Admin de l'Association/Liste spécifiée.
- **Corps (Body)** : `FormData`
  - `image` : Le fichier à uploader.
  - `association_id` OU `list_id` : Contexte pour la vérification des permissions.
- **Réponse** : JSON avec le nouvel ID/Détails de l'image.

#### `GET /api/image/[id]`

Proxy une image directement depuis le service Migallery.

- **Permissions** : Publique
- **Réponse** : Données binaires de l'image (avec le Content-Type correct).

#### `DELETE /api/image/[id]`

Supprime une image de la base de données locale et du service Migallery distant.

- **Permissions** : Admin (À FAIRE : Vérifier l'implémentation explicite des permissions)

### Auth

#### `GET /api/auth/login`

Initialise le flux de connexion CAS.

#### `GET /api/auth/logout`

Déconnecte l'utilisateur.
