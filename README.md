# Portail Étudiants (EMSE)

Ce dépôt contient le portail étudiant basé sur SvelteKit pour l'EMSE : une petite application web pour lister les associations, gérer les événements, exporter les données de calendrier (ICS) et fournir une authentification de base et des APIs.

Ce README explique l'objectif du projet, comment l'exécuter localement, comment le tester et le compiler, les variables d'environnement requises et des conseils de dépannage courants.

## Objectif

- Annuaire central pour les associations étudiantes
- Calendrier des événements et export ICS
- Endpoints API pour les associations, les événements et les utilisateurs
- Authentification utilisant `@auth/sveltekit`
- Interface utilisateur réactive implémentée avec SvelteKit

## Services Externes (Dépendances)

### Migallery

Le portail utilise **Migallery** pour l'hébergement et la gestion des images (logos associations, affiches événements).
Les endpoints `/api/image` agissent comme un proxy authentifié vers cette instance Migallery.

- **URL**: Configurable via `GALLERY_API_URL`
- **Authentification**: Clé API partagée (`GALLERY_API_KEY`)

## Documentation

- [Guide Admin](ADMIN_README.md) - Instructions pour les administrateurs.
- [Documentation API](API_DOCUMENTATION.md) - Détails sur les endpoints API disponibles.
- [Qualité du Code](CODE_QUALITY.md) - Normes et pratiques pour maintenir la qualité du code.
- [Permissions & Associations](PERMISSIONS_ASSOCIATIONS.md) - Guide sur les permissions des associations.
- [Référence](REFERENCE.md) - Références techniques et configurations.
- [Système de Session](SESSION_SYSTEM.md) - Explication de l'authentification et de la gestion de session.
- [Exemples de Session](SESSION_EXAMPLES.md) - Exemples de gestion de session.
- [Test Permissions](test-permissions.md) - Tester la logique des permissions.

## Démarrage rapide (développement local)

Prérequis

- Bun (ou Node 18+). Le projet est configuré avec Vite / SvelteKit.
- Une base de données compatible MySQL (ou une instance en cours d'exécution pour les routes API)

1. Installation de Bun (si ce n'est pas déjà fait)

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Installer les dépendances

```bash
bun install
# ou : bun install
```

3. Créer un fichier `.env` local (voir `.env.example`)

4. Lancer le serveur de développement

```bash
bun run dev
```

Ouvrez l'URL affichée par Vite (généralement http://localhost:5173).

Notes

- Pour le développement frontend uniquement, vous pouvez simuler ou mocker les réponses API si la base de données n'est pas disponible.

## Variables d'environnement

Créez un fichier `.env` avec les variables listées dans `.env.example`. Les variables clés utilisées par le code :

- `DB_HOST` — hôte de la base de données
- `DB_USER` — nom d'utilisateur de la base de données
- `DB_PASSWORD` — mot de passe de la base de données
- `DB_NAME` — nom de la base de données
- `DB_PORT` — port de la base de données (optionnel, défaut 3306)
- `AUTH_SECRET` — secret utilisé par la bibliothèque d'authentification (si configuré)

Voir `.env.example` pour un modèle.

## Scripts

- `bun run dev` — démarre le serveur de développement
- `bun run build` — compilation pour la production
- `bun run preview` — prévisualiser la compilation de production localement
- `bun run check` — exécuter svelte-check / vérification de type

## Tests

- Tests unitaires : Vitest est configuré dans le dépôt. Lancez avec `bunx vitest`.
- Des exemples de tests API existent sous `tests/api/` et des tests de composants sous `tests/components/`.
- Vérifications manuelles de l'API :
  - `GET /api/associations` — doit retourner une liste JSON d'associations (avec les URLs `icon`)
  - `GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` — retourne les événements dans la plage
  - `GET /api/calendar/ics` — télécharger le fichier ICS pour les événements à venir

## APIs (aperçu)

- `GET /api/associations` — lister les associations (traitées pour inclure les URLs `icon`)
- `POST /api/associations` — créer une association (requiert authentification)
- `GET /api/calendar` — requête d'événements par plage et associationId optionnel
- `GET /api/calendar/ics` — export ICS des événements à venir
- `GET /api/user/[id]` — données utilisateur

Explorez `src/routes/api` pour la liste complète des endpoints.

## Base de données

- L'application utilise `mysql2/promise`. L'assistant de base de données est dans `src/lib/server/database.ts`.
- L'assistant `db` est une fonction de gabarit littéral qui paramètre les valeurs (requêtes sécurisées).
- Les types sont dans `src/lib/databasetypes.d.ts`. Les lignes de la base de données (Types bruts) sont transformées en types traités pour le frontend.

## Notes de sécurité

- Utilisez toujours des requêtes préparées ou `escape()` lors de la construction de requêtes SQL. Ce dépôt utilise à la fois l'assistant de gabarit `db` et `escape()` explicite dans les endroits avec du SQL dynamique.
- Protégez les secrets d'authentification et les identifiants de base de données. Ne commitez pas `.env` dans git.

## CI / CD
