import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
            Room Manager
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Gérez et réservez vos salles de réunion en toute simplicité.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
