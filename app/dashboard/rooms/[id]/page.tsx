import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookingForm from "./BookingForm";

export default async function RoomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const roomId = parseInt(resolvedParams.id, 10);

  if (isNaN(roomId)) notFound();

  const now = new Date();
  // Horizon : on affiche les créneaux des 14 prochains jours
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [room, upcomingBookings] = await Promise.all([
    prisma.room.findUnique({
      where: { id: roomId },
      include: { company: true },
    }),
    prisma.booking.findMany({
      where: {
        roomId,
        status: { not: "cancelled" },
        endTime: { gte: now },
        startTime: { lte: horizon },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  if (!room) notFound();

  const equipment = Array.isArray(room.equipment) ? (room.equipment as string[]) : [];

  // Formater les créneaux pour le passage au composant client
  const bookedSlots = upcomingBookings.map((b) => ({
    start: b.startTime.toISOString(),
    end: b.endTime.toISOString(),
  }));

  // Grouper par jour pour l'affichage
  const slotsByDay = upcomingBookings.reduce<Record<string, typeof upcomingBookings>>((acc, booking) => {
    const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(booking.startTime);
    if (!acc[day]) acc[day] = [];
    acc[day].push(booking);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/rooms" className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Détails de la salle</h1>
          <p className="text-sm text-gray-500">Consultez les informations et réservez ce créneau.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne INFO */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10" />

            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-indigo-600 font-medium mb-6 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {room.company.name}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <span>👥</span> {room.capacity} personnes max
              </span>
              {upcomingBookings.some(b => b.startTime <= now && b.endTime >= now) ? (
                <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Occupée en ce moment
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disponible
                </span>
              )}
            </div>

            {room.description && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{room.description}</p>
              </div>
            )}

            {equipment.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Équipements inclus</h3>
                <div className="flex flex-wrap gap-2">
                  {equipment.map((e) => (
                    <span key={e} className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm shadow-sm">{e}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Créneaux réservés */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Créneaux réservés <span className="text-gray-400 font-normal normal-case">(14 prochains jours)</span>
            </h2>

            {Object.keys(slotsByDay).length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-500 text-xl">✅</span>
                <p className="text-sm text-emerald-700 font-medium">Aucun créneau réservé dans les 14 prochains jours.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDay).map(([day, bookings]) => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{day}</p>
                    <div className="space-y-1.5">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <span className="text-sm text-red-700 font-medium">
                            {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(b.startTime)}
                            {" → "}
                            {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(b.endTime)}
                          </span>
                          {b.purpose && (
                            <span className="text-xs text-red-400 truncate">· {b.purpose}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne RÉSERVATION */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Réserver</h2>
            <p className="text-sm text-gray-500 mb-6">Sélectionnez vos dates pour cette salle.</p>
            <BookingForm roomId={room.id} bookedSlots={bookedSlots} />
          </div>
        </div>
      </div>
    </div>
  );
}
