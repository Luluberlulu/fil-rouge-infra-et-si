"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCompanyAction } from "@/app/actions/admin";

export default function NewCompanyPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCompanyAction, { error: "", success: false });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/admin");
    }
  }, [state.success, router]);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle entreprise</h1>
          <p className="text-sm text-gray-500">Ajouter une entreprise à la plateforme</p>
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-medium">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nom de l'entreprise <span className="text-red-400">*</span>
            </label>
            <input id="name" name="name" type="text" placeholder="ACME Corp" required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
              Adresse
            </label>
            <input id="address" name="address" type="text" placeholder="1 rue Exemple, 75000 Paris"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              Téléphone
            </label>
            <input id="phone" name="phone" type="tel" placeholder="01 23 45 67 89"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/admin"
              className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              Annuler
            </Link>
            <button type="submit" disabled={isPending}
              className="flex-1 flex justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Créer l'entreprise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
