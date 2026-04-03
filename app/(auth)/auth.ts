"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { z } from "zod";

// --- SCHÉMAS DE VALIDATION (Zod) ---
const registerSchema = z.object({
  username: z
    .string()
    .min(2, "Le nom d'utilisateur doit contenir au moins 2 caractères.")
    .max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères.")
    .regex(/^[a-zA-Z0-9_\- ]+$/, "Le nom d'utilisateur contient des caractères invalides."),
  email: z
    .string()
    .email("Adresse email invalide.")
    .max(255, "L'email ne peut pas dépasser 255 caractères."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(128, "Le mot de passe ne peut pas dépasser 128 caractères."),
  companyId: z.coerce.number({ invalid_type_error: "Veuillez sélectionner une entreprise." })
    .int().positive("Veuillez sélectionner une entreprise."),
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide.")
    .max(255),
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .max(128),
});

// --- RATE LIMITING (en mémoire) ---
// En production, remplacer par Redis (@upstash/ratelimit)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count += 1;
  return true;
}

function resetRateLimit(key: string) {
  loginAttempts.delete(key);
}

// --- ACTION 1 : INSCRIPTION ---
export async function registerAction(prevState: any, formData: FormData) {
  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyId: formData.get("companyId"),
  };

  const result = registerSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides.", success: false };
  }

  const { username, email, password, companyId } = result.data;

  // Vérifier que l'entreprise existe réellement
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { error: "Entreprise introuvable.", success: false };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Cet email est déjà utilisé.", success: false };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Création de l'utilisateur ET du lien avec l'entreprise (transaction atomique)
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { username, email, password: hashedPassword } });
      await tx.companyUser.create({
        data: { userId: user.id, companyId, isAdmin: false },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Register Server Action Error:", error);
    return { error: "Une erreur serveur est survenue.", success: false };
  }
}

// --- ACTION 2 : CONNEXION ---
export async function loginAction(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides.", success: false };
  }

  const { email, password } = result.data;

  // Rate limiting par email
  if (!checkRateLimit(`login:${email}`)) {
    return {
      error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
      success: false,
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Condition corrigée : user doit exister ET avoir un mot de passe
    if (!user || !user.password) {
      return { error: "Identifiants invalides.", success: false };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return { error: "Identifiants invalides.", success: false };
    }

    resetRateLimit(`login:${email}`);

    const payload = { userId: user.id, email: user.email, isAdmin: user.isAdmin };
    const sessionToken = await encrypt(payload);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login Server Action Error:", error);
    return { error: "Une erreur serveur est survenue.", success: false };
  }
}
// --- ACTION 3 : DÉCONNEXION ---
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
