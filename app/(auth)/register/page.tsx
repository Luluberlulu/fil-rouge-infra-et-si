"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  // `useActionState` gère l'état (erreurs/succès) et l'état de chargement nativement (isPending)
  const [state, formAction, isPending] = useActionState(registerAction, { error: "", success: false });

  // Effet pour rediriger après un succès
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Rejoignez-nous</h1>
            <p className="text-slate-300 text-sm">Créez votre compte en quelques secondes</p>
          </div>

          {state.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
              Votre compte a été créé avec succès ! Vous allez être redirigé...
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="username">
                Nom d'utilisateur
              </label>
              {/* L'attribut name="username" est très important pour recupérer les valeurs via FormData */}
              <input
                id="username"
                name="username"
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Votre nom"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || state.success}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-all shadow-lg transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center mt-4 cursor-pointer"
            >
              {isPending ? (
                <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-300">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-white font-semibold hover:text-indigo-300 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
