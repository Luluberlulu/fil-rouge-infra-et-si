import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: number;
  email: string;
  isAdmin: boolean | null;
}

// Validation lazy : exécutée au runtime, pas au chargement du module (build time)
function getKey(): Uint8Array {
  const secretKey = process.env.AUTH_SECRET;
  if (!secretKey || secretKey.length < 32) {
    throw new Error(
      "AUTH_SECRET est manquant ou trop court (minimum 32 caractères). " +
      "Définissez une valeur aléatoire solide dans votre fichier .env."
    );
  }
  return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getKey());
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, getKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
