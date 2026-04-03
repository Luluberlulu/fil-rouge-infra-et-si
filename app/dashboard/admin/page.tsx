export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { deleteCompanyAction, toggleSuperAdminAction } from "@/app/actions/admin";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session || !session.isAdmin) redirect("/dashboard");

  const [companies, users] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: { select: { rooms: true, companyUsers: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      include: {
        companyUsers: { include: { company: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-linear-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-violet-200 text-sm font-medium mb-1">👑 Super Administration</p>
        <h1 className="text-2xl font-bold mb-1">Vue globale de la plateforme</h1>
        <p className="text-violet-200 text-sm">Gérez toutes les entreprises et tous les utilisateurs.</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Entreprises", value: companies.length, icon: "🏬", color: "text-violet-600 bg-violet-50" },
          { label: "Utilisateurs", value: users.length, icon: "👤", color: "text-blue-600 bg-blue-50" },
          {
            label: "Salles totales",
            value: companies.reduce((s, c) => s + c._count.rooms, 0),
            icon: "🏢", color: "text-indigo-600 bg-indigo-50"
          },
          {
            label: "Super Admins",
            value: users.filter((u) => u.isAdmin).length,
            icon: "👑", color: "text-amber-600 bg-amber-50"
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gestion des Entreprises */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entreprises</h2>
          <Link
            href="/dashboard/admin/companies/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
          >
            + Ajouter
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Adresse</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Salles</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Membres</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-4 text-gray-500 hidden sm:table-cell text-xs">{company.address ?? "—"}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {company._count.rooms}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                      {company._count.companyUsers}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <form action={deleteCompanyAction.bind(null, company.id)}>
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer font-medium"
                      >
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gestion des Utilisateurs */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tous les utilisateurs</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Entreprise(s)</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const isSelf = user.id === session.userId;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${user.isAdmin ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs hidden sm:table-cell">
                      {user.companyUsers.length > 0
                        ? user.companyUsers.map((cu) => cu.company.name).join(", ")
                        : <span className="text-gray-300">Aucune</span>}
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">👑 Super Admin</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Utilisateur</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!isSelf && (
                        <form action={toggleSuperAdminAction.bind(null, user.id)}>
                          <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all cursor-pointer font-medium">
                            {user.isAdmin ? "Rétrograder" : "Promouvoir"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
