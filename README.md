Pour démarrer le développement sur le projet :
1. Cloner le repo
2. Lancer les commandes suivantes :
    ```bash
    pnpm install
    pnpm dev
    ```
3. Démarrer docker desktop pour la base de données
    ```bash
    docker desktop start
    docker compose up -d
    ```
4. Lancer les migrations
    ```bash
    pnpm dlx prisma migrate dev
    ```