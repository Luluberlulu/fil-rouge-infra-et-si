export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { removeUserFromCompanyAction, toggleAdminRoleAction } from "@/app/actions/users";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Récupérer l'entreprise de l'admin connecté
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId, isAdmin: true },
    include: { company: true },
  });

  // Si l'utilisateur n'est pas admin, on le redirige
  if (!companyUser) {
    redirect("/dashboard");
  }

  const { company } = companyUser;

  // Récupérer tous les users de cette entreprise
  const members = await prisma.companyUser.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, username: true, email: true, createdAt: true } } },
    orderBy: { user: { username: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gestion des membres</h1>
        <p className="text-sm text-gray-500 mt-0.5">{company.name} — {members.length} membre(s)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôle</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Membre depuis</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map(({ user, isAdmin }) => {
              const isSelf = user.id === session.userId;
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {isAdmin ? "Admin" : "Membre"}
                      {isSelf && " (vous)"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {!isSelf && (
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleAdminRoleAction.bind(null, user.id)}>
                          <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer font-medium">
                            {isAdmin ? "Rétrograder" : "Promouvoir"}
                          </button>
                        </form>
                        <form action={removeUserFromCompanyAction.bind(null, user.id)}>
                          <button
                            type="submit"
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer font-medium"
                          >
                            Retirer
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
