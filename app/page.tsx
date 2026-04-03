import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[1000px] h-[1000px] rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] rounded-full bg-blue-50/50 blur-3xl" />
      </div>

      <div className="text-center max-w-2xl relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
          Simple, Rapide, Efficace
        </span>
        
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          Gérez vos salles de réunion <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">sans effort</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed font-light">
          Room Manager est la solution ultime pour optimiser vos espaces de travail, synchroniser vos équipes et éviter les conflits de réservation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)]"
          >
            S'inscrire
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
