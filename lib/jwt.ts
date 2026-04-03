import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.AUTH_SECRET;

// Vérification de la solidité du secret au démarrage
if (!secretKey || secretKey.length < 32) {
  throw new Error(
    "AUTH_SECRET est manquant ou trop court (minimum 32 caractères). " +
    "Définissez une valeur aléatoire solide dans votre fichier .env."
  );
}

const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: number;
  email: string;
  isAdmin: boolean | null;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
