# Page d'Administration de la Base de Données

## Accès

La page d'administration est accessible à l'URL : `/dev/admin` (ou `/admin` selon votre configuration de base path)

## Fonctionnalités

Cette interface permet de gérer toutes les tables principales de la base de données :

### Tables Disponibles

1. **Utilisateurs** (`users`)
   - Visualiser tous les utilisateurs
   - Ajouter de nouveaux utilisateurs
   - Modifier les informations utilisateur (nom, prénom, email, login, permissions)
   - Supprimer des utilisateurs

2. **Associations** (`associations`)
   - Gérer les associations étudiantes
   - Modifier handle, nom, description et couleur
   - Créer et supprimer des associations

3. **Rôles** (`roles`)
   - Configurer les rôles disponibles
   - Définir la hiérarchie et les permissions
   - Ajouter/modifier/supprimer des rôles

4. **Membres** (`members`)
   - Lier utilisateurs et associations avec leurs rôles
   - Gérer la visibilité des membres
   - Vue enrichie avec noms d'utilisateur, association et rôle

5. **Événements** (`events`)
   - Créer et gérer les événements
   - Associer aux associations
   - Définir dates, lieu et description

## Routes API Créées

Toutes les routes suivent le pattern REST standard :

### `/dev/api/users`

- `GET` : Liste tous les utilisateurs
- `POST` : Crée un nouvel utilisateur
- `PUT` : Met à jour un utilisateur existant
- `DELETE` : Supprime un utilisateur

### `/dev/api/roles`

- `GET` : Liste tous les rôles
- `POST` : Crée un nouveau rôle
- `PUT` : Met à jour un rôle
- `DELETE` : Supprime un rôle

### `/dev/api/members`

- `GET` : Liste tous les membres avec JOIN sur users, associations et roles
- `POST` : Crée un nouveau membre
- `PUT` : Met à jour un membre
- `DELETE` : Supprime un membre

### `/dev/api/events`

- `GET` : Liste tous les événements avec JOIN sur associations
- `POST` : Crée un nouvel événement
- `PUT` : Met à jour un événement
- `DELETE` : Supprime un événement

### Existantes (conservées)

- `/dev/api/associations` : GET (liste), POST (création)
- `/dev/api/associations/[id]` : GET, PUT, DELETE
- `/dev/api/user/[id]` : GET (avec option fullUser)
- `/dev/api/user/me` : GET (utilisateur connecté)

## Sécurité

⚠️ **Important** : Toutes les opérations de modification (POST, PUT, DELETE) nécessitent une authentification. L'utilisateur doit être connecté via Better Auth.

Les opérations de lecture (GET) sont publiques pour faciliter la consultation.

## Utilisation

1. Sélectionnez la table à gérer via les boutons en haut
2. Utilisez **"➕ Ajouter"** pour créer un nouvel élément
3. Cliquez sur **"✏️"** pour éditer une ligne
4. Cliquez sur **"🗑️"** pour supprimer une ligne
5. Lors de l'édition :
   - **"💾"** pour sauvegarder
   - **"❌"** pour annuler

## Champs Spéciaux

- **Dates** : Utilisent un sélecteur datetime-local
- **Relations** : Affichent des listes déroulantes (associations, users, roles)
- **Booléens** : Cases à cocher (ex: visible pour les membres)
- **Descriptions** : Zone de texte multiligne

## Responsive

L'interface s'adapte aux écrans mobiles avec :

- Boutons réorganisés
- Tableau scrollable horizontalement
- Actions réduites en colonnes sur petit écran
