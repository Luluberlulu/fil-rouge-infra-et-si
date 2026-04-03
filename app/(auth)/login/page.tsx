"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/(auth)/auth";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: "",
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Bon retour !
            </h1>
            <p className="text-slate-300 text-sm">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {state.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-200"
                htmlFor="email"
              >
                Adresse email
              </label>
              {/* Le champ name="email" transmettra les données via FormData à Server Action */}
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-sm font-medium text-slate-200"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <Link
                  href="#"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Oublié ?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending || state.success}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center cursor-pointer"
            >
              {isPending ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-300">
            Vous n'avez pas encore de compte ?{" "}
            <Link
              href="/register"
              className="text-white font-semibold hover:text-indigo-300 transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
