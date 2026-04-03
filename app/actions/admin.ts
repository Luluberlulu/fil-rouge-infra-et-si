"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/jwt";

async function getSuperAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await decrypt(token);
  // Seuls les users avec User.isAdmin = true ont accès
  if (!session || !session.isAdmin) redirect("/dashboard");
  return session;
}

const companySchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères.").max(255),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
});

// --- Créer une entreprise ---
export async function createCompanyAction(prevState: any, formData: FormData) {
  await getSuperAdminSession();

  const result = companySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides.", success: false };
  }

  try {
    await prisma.company.create({ data: result.data });
    return { success: true };
  } catch {
    return { error: "Une erreur est survenue.", success: false };
  }
}

// --- Supprimer une entreprise ---
export async function deleteCompanyAction(companyId: number) {
  await getSuperAdminSession();
  // Cascade configurée dans le schéma : rooms, companyUsers, bookings seront supprimés
  await prisma.company.delete({ where: { id: companyId } });
  redirect("/dashboard/admin");
}

// --- Promouvoir un user en super-admin ---
export async function toggleSuperAdminAction(targetUserId: number) {
  const session = await getSuperAdminSession();
  if (targetUserId === session.userId) redirect("/dashboard/admin");

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) redirect("/dashboard/admin");

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isAdmin: !user.isAdmin },
  });
  redirect("/dashboard/admin");
}
