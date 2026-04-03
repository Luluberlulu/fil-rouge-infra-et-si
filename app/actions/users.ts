"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/jwt";

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await decrypt(token);
  if (!session) redirect("/login");
  return session;
}

async function getAdminCompany(userId: number) {
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId, isAdmin: true },
  });
  if (!companyUser) return null;
  return companyUser.companyId;
}

// --- Retirer un user de l'entreprise ---
export async function removeUserFromCompanyAction(targetUserId: number) {
  const session = await getAdminSession();
  const companyId = await getAdminCompany(session.userId);
  if (!companyId) redirect("/dashboard");

  // Un admin ne peut pas se retirer lui-même
  if (targetUserId === session.userId) redirect("/dashboard/users");

  await prisma.companyUser.delete({
    where: { userId_companyId: { userId: targetUserId, companyId } },
  });

  redirect("/dashboard/users");
}

// --- Basculer le rôle admin d'un user ---
export async function toggleAdminRoleAction(targetUserId: number) {
  const session = await getAdminSession();
  const companyId = await getAdminCompany(session.userId);
  if (!companyId) redirect("/dashboard");
  if (targetUserId === session.userId) redirect("/dashboard/users");

  const companyUser = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: targetUserId, companyId } },
  });
  if (!companyUser) redirect("/dashboard/users");

  await prisma.companyUser.update({
    where: { userId_companyId: { userId: targetUserId, companyId } },
    data: { isAdmin: !companyUser.isAdmin },
  });

  redirect("/dashboard/users");
}
