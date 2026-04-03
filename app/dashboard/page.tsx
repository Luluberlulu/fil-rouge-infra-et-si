export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Récupérer l'entreprise de l'utilisateur
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId },
    include: { company: true },
  });

  const companyId = companyUser?.company.id;
  const companyName = companyUser?.company.name;

  // Stats filtrées par l'entreprise du user (ou globales si pas d'entreprise)
  const now = new Date();
  const [userCount, roomCount, bookingCount, upcomingBookings] = await Promise.all([
    companyId
      ? prisma.companyUser.count({ where: { companyId } })
      : prisma.user.count(),
    companyId
      ? prisma.room.count({ where: { companyId } })
      : prisma.room.count(),
    companyId
      ? prisma.booking.count({ where: { room: { companyId }, status: { not: "cancelled" } } })
      : prisma.booking.count({ where: { userId: session.userId, status: { not: "cancelled" } } }),
    prisma.booking.findMany({
      where: companyId
        ? { room: { companyId }, startTime: { gt: now }, status: { not: "cancelled" } }
        : { userId: session.userId, startTime: { gt: now }, status: { not: "cancelled" } },
      include: { room: { select: { name: true } }, user: { select: { username: true } } },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Membres", value: userCount, icon: "👤", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    { label: "Salles", value: roomCount, icon: "🏢", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    { label: "Réservations", value: bookingCount, icon: "📅", bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
  ];

  return (
    <div className="space-y-8">
      {/* Bandeau de bienvenue */}
      <div className="bg-linear-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
        <p className="text-indigo-100 text-sm font-medium mb-1">Bonjour 👋</p>
        <h1 className="text-2xl font-bold mb-1">
          {companyName ? companyName : "Votre espace"}
        </h1>
        <p className="text-indigo-200 text-sm">
          {companyName
            ? "Gérez vos salles, vos équipes et vos réservations depuis ici."
            : "Vous n'êtes associé à aucune entreprise pour l'instant."}
        </p>
      </div>

      {/* Statistiques filtrées */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {companyName ? `Vue d'ensemble — ${companyName}` : "Vue d'ensemble"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl border ${stat.border} shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${stat.bg} ${stat.text}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prochaines réservations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prochaines réservations</h2>
          <Link href="/dashboard/bookings" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Voir tout →</Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">📅</span>
            <p className="text-gray-600 font-medium text-sm">Aucune réservation à venir</p>
            <Link href="/dashboard/rooms" className="text-xs text-indigo-600 font-medium hover:text-indigo-500">Réserver une salle →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="bg-indigo-50 rounded-lg p-2 text-center min-w-[44px] shrink-0">
                  <p className="text-[10px] font-medium text-indigo-400 uppercase leading-none">
                    {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(booking.startTime)}
                  </p>
                  <p className="text-lg font-bold text-indigo-700 leading-tight">
                    {new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(booking.startTime)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{booking.room.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(booking.startTime)}
                    {" → "}
                    {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(booking.endTime)}
                  </p>
                </div>
                <Link href="/dashboard/bookings" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors shrink-0">→</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}