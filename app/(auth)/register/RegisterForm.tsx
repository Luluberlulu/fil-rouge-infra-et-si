"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction } from "../auth";

type Company = { id: number; name: string };

export default function RegisterForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, { error: "", success: false });

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Créer un compte</h1>
          <p className="mt-2 text-sm text-gray-500">Rejoignez-nous en quelques clics</p>
        </div>

        {state.error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <h3 className="text-sm font-medium text-red-800 text-center">{state.error}</h3>
          </div>
        )}

        {state.success && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <h3 className="text-sm font-medium text-green-800 text-center">
              Compte créé avec succès ! Redirection...
            </h3>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Nom d'utilisateur
            </label>
            <input
              id="username" name="username" type="text" placeholder="Jean Dupont" required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email" name="email" type="email" placeholder="vous@exemple.com" required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password" name="password" type="password" placeholder="••••••••" required minLength={8}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="companyId">
              Votre entreprise
            </label>
            <select
              id="companyId" name="companyId" required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm bg-white"
            >
              <option value="">-- Sélectionnez votre entreprise --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit" disabled={isPending || state.success}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
