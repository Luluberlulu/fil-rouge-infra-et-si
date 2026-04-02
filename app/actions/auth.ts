"use server";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "../../lib/jwt";
import { cookies } from "next/headers";

// --- ACTION 1 : INSCRIPTION ---
export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) {
    return { error: "Tous les champs (username, email, password) sont requis.", success: false };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Cet email est déjà utilisé.", success: false };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Register Server Action Error:", error);
    return { error: "Une erreur serveur est survenue.", success: false };
  }
}

// --- ACTION 2 : CONNEXION ---
export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis.", success: false };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || (!user.password && !user.isAdmin)) {
      return { error: "Identifiants invalides.", success: false };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password as string);

    if (!passwordsMatch) {
      return { error: "Identifiants invalides.", success: false };
    }

    const payload = { 
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin 
    };
    
    // Création du JWT
    const sessionToken = await encrypt(payload);

    // Stockage du cookie directement depuis le serveur !
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login Server Action Error:", error);
    return { error: "Une erreur serveur est survenue.", success: false };
  }
}
