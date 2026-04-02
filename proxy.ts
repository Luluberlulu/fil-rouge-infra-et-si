import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./lib/jwt";

// Routes qui nécessitent d'être connecté
const PROTECTED_ROUTES = ["/dashboard"];
// Routes accessibles uniquement si NON connecté
const AUTH_ROUTES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  const isAuthenticated = !!session;

  // Rediriger vers /login si la route est protégée et l'utilisateur non connecté
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rediriger vers /dashboard si l'utilisateur est déjà connecté et tente d'accéder à /login ou /register
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Appliquer le proxy sur toutes les routes sauf les fichiers statiques et l'API Next.js interne
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
