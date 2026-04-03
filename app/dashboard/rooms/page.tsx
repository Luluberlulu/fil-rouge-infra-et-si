export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import DeleteRoomButton from "./DeleteRoomButton";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

export default async function RoomsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Récupérer l'entreprise de l'utilisateur
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId },
    include: {
      company: {
        include: {
          rooms: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const isAdmin = companyUser?.isAdmin ?? false;
  const companyName = companyUser?.company?.name ?? null;

  // Récupérer les salles avec leurs réservations actives EN CE MOMENT
  const now = new Date();
  const rooms = companyUser?.company
    ? await prisma.room.findMany({
        where: { companyId: companyUser.company.id },
        orderBy: { createdAt: "desc" },
        include: {
          bookings: {
            where: {
              status: { not: "cancelled" },
              startTime: { lte: now },
              endTime: { gte: now },
            },
            take: 1,
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* En-tête de page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Salles</h1>
          {companyName && <p className="text-sm text-gray-500 mt-0.5">{companyName}</p>}
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/rooms/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-100 transition-all"
          >
            <span>+</span> Ajouter une salle
          </Link>
        )}
      </div>

      {/* Pas d'entreprise associée */}
      {!companyUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <p className="text-yellow-800 font-medium">Vous n'êtes associé à aucune entreprise.</p>
          <p className="text-yellow-600 text-sm mt-1">Demandez à un administrateur de vous ajouter à une entreprise.</p>
        </div>
      )}

      {/* Liste des salles */}
      {companyUser && rooms.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🏢</span>
          <p className="text-gray-700 font-medium">Aucune salle enregistrée</p>
          {isAdmin && (
            <Link href="/dashboard/rooms/new" className="text-sm text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
              Créer la première salle →
            </Link>
          )}
        </div>
      )}

      {rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const equipment = Array.isArray(room.equipment) ? room.equipment as string[] : [];
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">👥 {room.capacity} personnes</span>
                    </p>
                  </div>
                  {room.bookings.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Occupée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Disponible
                    </span>
                  )}
                </div>

                {room.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{room.description}</p>
                )}

                {equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {equipment.map((item: string) => (
                      <span key={item} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="flex-1 text-center py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    Voir
                  </Link>
                  {isAdmin && (
                    <DeleteRoomButton roomId={room.id} roomName={room.name} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
