"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRoomAction } from "@/app/actions/rooms";

export default function NewRoomPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createRoomAction, { error: "", success: false });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/rooms");
    }
  }, [state.success, router]);

  return (
    <div className="max-w-xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/rooms"
          className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle salle</h1>
          <p className="text-sm text-gray-500">Ajoutez une salle à votre entreprise</p>
        </div>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-medium text-red-800 text-center">{state.error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form action={formAction} className="space-y-5">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nom de la salle <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Salle de conférence A"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          {/* Capacité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="capacity">
              Capacité (personnes) <span className="text-red-400">*</span>
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              placeholder="10"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Grande salle avec vue sur le jardin..."
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm resize-none"
            />
          </div>

          {/* Équipements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="equipment">
              Équipements
            </label>
            <input
              id="equipment"
              name="equipment"
              type="text"
              placeholder="Projecteur, Tableau blanc, Vidéoconférence"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors sm:text-sm"
            />
            <p className="mt-1.5 text-xs text-gray-400">Séparez les équipements avec des virgules.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/rooms"
              className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Créer la salle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
