# Room Manager

Application de gestion de salles de réunion pour entreprises. Permet aux utilisateurs de réserver des salles, et aux admins de gérer les salles et les membres.

## Stack technique

- **Framework** : Next.js 16 (App Router, Server Actions)
- **Base de données** : PostgreSQL (via Docker)
- **ORM** : Prisma 7 avec adaptateur `pg`
- **Auth** : JWT (jose) + cookies httpOnly
- **UI** : Tailwind CSS 4
- **Runtime** : Node.js, pnpm

## Prérequis

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Démarrage du développement

### 1. Cloner le repo

```bash
git clone <url-du-repo>
cd fil-rouge-infra-et-si
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Base de données (utilisé par docker-compose)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=rmanager

# URL de connexion Prisma (doit correspondre aux variables ci-dessus)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rmanager

# Secret JWT (min. 32 caractères aléatoires)
AUTH_SECRET=WOcJTDesLYyk4hg6tTSg6lNFf0rlPvc3
```

> **Important** : `DATABASE_URL` doit correspondre à `DB_USER`, `DB_PASSWORD` et `DB_NAME`.

### 4. Démarrer la base de données (Docker)

```bash
docker compose up -d
```

### 5. Lancer les migrations Prisma

```bash
pnpm dlx prisma migrate dev
```

### 6. (Optionnel) Peupler la base avec des données de test

```bash
pnpm seed
```

### 7. Démarrer l'application

```bash
pnpm dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/
  (auth)/          # Pages login et register (non protégées)
    auth.ts        # Server Actions : login, register, logout
    login/
    register/
  actions/         # Server Actions métier
    bookings.ts
    rooms.ts
    users.ts
    admin.ts
  dashboard/       # Pages protégées (nécessite d'être connecté)
    layout.tsx     # Sidebar + header avec vérification de session
    page.tsx       # Vue d'ensemble
    bookings/
    rooms/
    users/
    admin/         # Réservé aux Super Admins (User.isAdmin = true)
lib/
  jwt.ts           # Chiffrement / déchiffrement JWT
  prisma.ts        # Instance Prisma (singleton)
prisma/
  schema.prisma    # Modèles de données
  migrations/
  seed.ts          # Données initiales
```

## Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| **Utilisateur** | Peut consulter les salles et faire des réservations |
| **Admin entreprise** | Peut gérer les salles et les membres de son entreprise (`CompanyUser.isAdmin = true`) |
| **Super Admin** | Accès complet à toutes les entreprises (`User.isAdmin = true`) |

## Déploiement (Docker)

Un `Dockerfile` et un `docker-compose.yml` sont inclus pour le déploiement en production.

```bash
docker compose up --build
```
