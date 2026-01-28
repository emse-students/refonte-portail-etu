# Documentation de Référence du Projet

Ce document fournit une référence technique pour la base de code, incluant l'architecture, les modèles de données et les points de terminaison de l'API.

## Vue d'ensemble de l'Architecture

Le projet est construit avec **SvelteKit** et suit une structure standard :

- **`src/routes/`** : Contient les pages de l'application et les points de terminaison de l'API (routage basé sur les fichiers).
- **`src/lib/`** : Contient les utilitaires partagés, les composants et la logique côté serveur.
  - **`server/`** : Code réservé au serveur (connexions base de données, journalisation, secrets).
  - **`components/`** : Composants Svelte réutilisables.
  - **`utils.ts`** : Fonctions utilitaires générales.
- **`static/`** : Actifs statiques servis directement.

## Modèles de Données

L'application utilise les entités de données centrales suivantes (définies dans `src/lib/databasetypes.d.ts`) :

- **Association** : Représente une association étudiante (ex : BDE, BDS).
- **List** : Un sous-groupe ou une liste de campagne rattachée à une association.
- **User** : Un étudiant ou un administrateur accédant au portail.
- **Member** : Lie un Utilisateur à une Association/Liste avec des permissions spécifiques.
- **Event** : Un événement organisé par une association.

## Référence de l'API

L'API est située à `/api` et inclut les espaces de noms suivants :

| Espace de noms (Endpoint) | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `/api/associations`       | Gérer les associations (CRUD).                               |
| `/api/auth`               | Routes d'authentification (connexion, déconnexion, session). |
| `/api/calendar`           | Export de calendrier ICS et récupération d'événements.       |
| `/api/config`             | Paramètres de configuration de l'application.                |
| `/api/events`             | Gestion des événements.                                      |
| `/api/image`              | Téléchargement et récupération d'images.                     |
| `/api/lists`              | Gérer les listes (campagnes/sous-groupes).                   |
| `/api/members`            | Gérer les membres d'association.                             |
| `/api/users`              | Gestion des utilisateurs.                                    |

## Fichiers de Configuration Clés

- **`svelte.config.js`** : Configuration SvelteKit (adaptateurs, préprocesseurs).
- **`vite.config.ts`** : Configuration de build Vite, incluant les plugins et la configuration des tests.
- **`vitest.config.ts`** : Configuration pour le lanceur de tests Vitest.
- **`playwright.config.ts`** : Configuration pour les tests E2E avec Playwright.
- **`eslint.config.js`** : Règles de linting.

## Tests

- **Tests Unitaires** : Exécutés via `bun run test` (Vitest). Situés dans `tests/unit` et aux côtés des composants.
- **Tests E2E** : Exécutés via `bun run test:e2e` (Playwright). Situés dans `tests/e2e`.

## Journalisation

La journalisation côté serveur est gérée par `winston` (configuré dans `src/lib/server/logger.ts`). Les journaux sont sortis dans la console au format JSON en production.
