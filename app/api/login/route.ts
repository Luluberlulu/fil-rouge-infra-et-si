import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || (!user.password && !user.isAdmin)) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password as string);

    if (!passwordsMatch) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const payload = { 
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin 
    };
    
    const sessionToken = await encrypt(payload);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 24, 
      path: "/", 
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword, message: "Connexion réussie" }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
