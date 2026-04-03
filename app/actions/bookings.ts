"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/jwt";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

const bookingSchema = z.object({
  roomId: z.coerce.number(),
  // On accepte la chaîne ISO que nous construirons dans l'action Serveur
  startTime: z.string().datetime({ message: "Format de date invalide." }),
  endTime: z.string().datetime({ message: "Format de date invalide." }),
  purpose: z.string().max(255).optional(),
});

export async function createBookingAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé", success: false };

  const startLocal = formData.get("startTime") as string;
  const endLocal = formData.get("endTime") as string;
  
  if (!startLocal || !endLocal) {
    return { error: "Les dates sont requises.", success: false };
  }

  const startTimeIso = new Date(startLocal).toISOString();
  const endTimeIso = new Date(endLocal).toISOString();

  const rawData = {
    roomId: formData.get("roomId"),
    startTime: startTimeIso,
    endTime: endTimeIso,
    purpose: formData.get("purpose") || undefined,
  };

  const result = bookingSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides.", success: false };
  }

  const { roomId, purpose } = result.data;
  const tStart = new Date(result.data.startTime);
  const tEnd = new Date(result.data.endTime);

  if (tStart >= tEnd) {
    return { error: "L'heure de fin doit être après l'heure de début.", success: false };
  }

  // Vérification des chevauchements (uniquement sur réservations actives)
  const overlapping = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { not: "cancelled" },
      AND: [
        { startTime: { lt: tEnd } },
        { endTime: { gt: tStart } }
      ]
    }
  });

  if (overlapping) {
    return { error: "Cette salle est déjà réservée sur ce créneau horaire.", success: false };
  }

  try {
    await prisma.booking.create({
      data: {
        roomId,
        userId: session.userId,
        startTime: tStart,
        endTime: tEnd,
        purpose,
        status: "confirmed"
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Booking Error:", error);
    return { error: "Erreur lors de la réservation en BDD.", success: false };
  }
}

// --- ACTION : ANNULER UNE RÉSERVATION ---
import { redirect } from "next/navigation";

export async function cancelBookingAction(bookingId: number) {
  const session = await getSession();
  if (!session) redirect("/login");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) redirect("/dashboard/bookings");

  // Seul le créateur OU un admin de l'entreprise peut annuler
  const isOwner = booking.userId === session.userId;
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      userId: session.userId,
      isAdmin: true,
      company: { rooms: { some: { id: booking.roomId } } }
    }
  });
  const isCompanyAdmin = !!companyUser;

  if (!isOwner && !isCompanyAdmin && !session.isAdmin) {
    redirect("/dashboard/bookings");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" }
  });

  redirect("/dashboard/bookings");
}
