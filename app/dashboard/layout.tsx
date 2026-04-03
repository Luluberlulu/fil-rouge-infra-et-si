import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/jwt";
import { logoutAction } from "@/app/(auth)/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return decrypt(token);
}

const navLinks = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: "📊" },
  { href: "/dashboard/rooms", label: "Salles", icon: "🏢" },
  { href: "/dashboard/bookings", label: "Réservations", icon: "📅" },
];

const superAdminLinks = [
  { href: "/dashboard/admin", label: "Toutes les entreprises", icon: "🏬" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Vérification indépendante : est-il admin de son entreprise ?
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.userId, isAdmin: true },
  });
  const isCompanyAdmin = !!companyUser;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
              R
            </div>
            <span className="text-lg font-bold text-gray-900">Room Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
                {session.email?.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-gray-800">{session.email}</span>
              {session.isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  👑 Super Admin
                </span>
              )}
              {!session.isAdmin && isCompanyAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  Admin
                </span>
              )}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1 sticky top-24">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all group"
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Section Company Admin : basée sur CompanyUser.isAdmin */}
            {isCompanyAdmin && (
              <>
                <div className="pt-3 pb-1">
                  <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider px-3">Mon entreprise</p>
                </div>
                <Link
                  href="/dashboard/rooms/new"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                >
                  <span className="text-base">➕</span>
                  Ajouter une salle
                </Link>
                <Link
                  href="/dashboard/users"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                >
                  <span className="text-base">👥</span>
                  Gérer les membres
                </Link>
              </>
            )}

            {/* Section Super Admin : basée sur User.isAdmin */}
            {session.isAdmin && (
              <>
                <div className="pt-3 pb-1">
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider px-3">👑 Super Admin</p>
                </div>
                {superAdminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-amber-700 hover:bg-amber-50 transition-all"
                  >
                    <span className="text-base">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
