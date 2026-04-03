# ============================================================
# Stage 1 – Base : image commune à toutes les étapes
# ============================================================
FROM node:22-alpine AS base

# Dépendances système nécessaires à Prisma (libssl, openssl) sur Alpine
RUN apk add --no-cache libc6-compat openssl

# Active Corepack pour utiliser pnpm sans installation supplémentaire
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ============================================================
# Stage 2 – Deps : installation des dépendances
# ============================================================
FROM base AS deps

# Copie les fichiers de lock en premier pour profiter du cache Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installation des dépendances de production + dev (nécessaire pour le build)
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 3 – Builder : compilation de l'application
# ============================================================
FROM base AS builder

WORKDIR /app

# Récupère les node_modules installés à l'étape précédente
COPY --from=deps /app/node_modules ./node_modules

# Copie le reste du code source
COPY . .

# Génère le client Prisma (output: ../generated/client selon le schéma)
RUN pnpm exec prisma generate

# Build Next.js en mode standalone
# NEXT_TELEMETRY_DISABLED évite les appels réseau pendant le build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ============================================================
# Stage 4 – Runner : image de production légère
# ============================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

# Active pnpm pour pouvoir utiliser pnpm exec prisma au démarrage
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crée un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie les assets publics
COPY --from=builder /app/public ./public

# Copie le build standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copie le client Prisma généré (chemin défini dans schema.prisma : output = "../generated/client")
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

# Copie le schéma et la config Prisma (nécessaires pour migrate deploy au démarrage)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copie node_modules pour que pnpm exec prisma puisse charger prisma.config.ts via tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Applique les migrations Prisma via pnpm exec (charge prisma.config.ts) puis démarre l'app
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node server.js"]
