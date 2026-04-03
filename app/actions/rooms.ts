"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/jwt";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

const roomSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(255),
  capacity: z.coerce.number().int().min(1, "La capacité doit être d'au moins 1 personne."),
  description: z.string().max(1000).optional(),
  equipment: z.string().optional(),
});

// --- ACTION : CRÉER UNE SALLE ---
export async function createRoomAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Non autorisé.", success: false };
  }

  // Vérifier que l'utilisateur est admin d'une entreprise
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId, isAdmin: true },
  });

  if (!companyUser) {
    return { error: "Vous devez être administrateur d'une entreprise pour créer une salle.", success: false };
  }

  const rawData = {
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    description: formData.get("description") || undefined,
    equipment: formData.get("equipment") || undefined,
  };

  const result = roomSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides.", success: false };
  }

  const { name, capacity, description, equipment } = result.data;

  try {
    // Transformer la liste d'équipements en tableau JSON
    const equipmentArray = equipment
      ? equipment.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    await prisma.room.create({
      data: {
        companyId: companyUser.companyId,
        name,
        capacity,
        description: description ?? null,
        equipment: equipmentArray.length > 0 ? equipmentArray : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("createRoomAction Error:", error);
    return { error: "Une erreur serveur est survenue.", success: false };
  }
}

// --- ACTION : SUPPRIMER UNE SALLE ---
export async function deleteRoomAction(roomId: number) {
  const session = await getSession();
  if (!session) redirect("/login");

  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId, isAdmin: true },
  });
  if (!companyUser) return { error: "Non autorisé." };

  const room = await prisma.room.findFirst({
    where: { id: roomId, companyId: companyUser.companyId },
  });
  if (!room) return { error: "Salle introuvable." };

  await prisma.room.delete({ where: { id: roomId } });
  redirect("/dashboard/rooms");
}
