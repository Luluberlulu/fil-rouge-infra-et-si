export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { cancelBookingAction } from "@/app/actions/bookings";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  confirmed: { label: "Confirmée", classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled: { label: "Annulée", classes: "bg-red-50 text-red-600 border-red-100" },
  pending: { label: "En attente", classes: "bg-yellow-50 text-yellow-700 border-yellow-100" },
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function duration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Vérifier si l'utilisateur est admin de son entreprise
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId, isAdmin: true },
    include: { company: true },
  });
  const isCompanyAdmin = !!companyUser;

  // Les admins voient toutes les réservations de leur entreprise
  // Les users voient seulement les leurs
  const bookings = await prisma.booking.findMany({
    where: isCompanyAdmin
      ? { room: { companyId: companyUser!.companyId } }
      : { userId: session.userId },
    include: {
      room: { include: { company: { select: { name: true } } } },
      user: { select: { username: true, email: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const now = new Date();
  const upcoming = bookings.filter(b => b.endTime > now && b.status !== "cancelled");
  const past = bookings.filter(b => b.endTime <= now || b.status === "cancelled");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Réservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCompanyAdmin
              ? `Toutes les réservations de ${companyUser!.company.name}`
              : "Vos réservations personnelles"}
          </p>
        </div>
        <Link
          href="/dashboard/rooms"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
        >
          <span>+</span> Nouvelle réservation
        </Link>
      </div>

      {/* Réservations à venir */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          À venir ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-gray-700 font-medium">Aucune réservation à venir</p>
            <Link href="/dashboard/rooms" className="text-sm text-indigo-600 font-medium hover:text-indigo-500">
              Réserver une salle →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => {
              const status = STATUS_STYLES[booking.status ?? "confirmed"] ?? STATUS_STYLES["confirmed"];
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date indicator */}
                  <div className="bg-indigo-50 rounded-xl p-3 text-center min-w-[60px] shrink-0">
                    <p className="text-xs font-medium text-indigo-500 uppercase">
                      {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(booking.startTime)}
                    </p>
                    <p className="text-2xl font-bold text-indigo-700 leading-none">
                      {new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(booking.startTime)}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{booking.room.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(booking.startTime)} → {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(booking.endTime)}
                      <span className="mx-1 text-gray-300">·</span>
                      <span className="text-indigo-600 font-medium">{duration(booking.startTime, booking.endTime)}</span>
                    </p>
                    {booking.purpose && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {booking.purpose}</p>
                    )}
                    {isCompanyAdmin && (
                      <p className="text-xs text-gray-400 mt-0.5">👤 {booking.user.username}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/rooms/${booking.roomId}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-medium"
                    >
                      Voir la salle
                    </Link>
                    <form action={cancelBookingAction.bind(null, booking.id)}>
                      <button type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer font-medium"
                      >
                        Annuler
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Historique ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((booking) => {
              const status = STATUS_STYLES[booking.status ?? "confirmed"] ?? STATUS_STYLES["confirmed"];
              return (
                <div key={booking.id} className="bg-white/60 rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 text-sm">{booking.room.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(booking.startTime)}
                      {booking.purpose && ` · ${booking.purpose}`}
                      {isCompanyAdmin && ` · ${booking.user.username}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
