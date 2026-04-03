"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "@/app/actions/bookings";

type BookedSlot = { start: string; end: string };

export default function BookingForm({
  roomId,
  bookedSlots = [],
}: {
  roomId: number;
  bookedSlots?: BookedSlot[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBookingAction, { error: "", success: false });
  const [clientError, setClientError] = useState<string | null>(null);
  const [startVal, setStartVal] = useState("");
  const [endVal, setEndVal] = useState("");

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => router.push("/dashboard/bookings"), 1500);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  // Validation de chevauchement côté client (feedback immédiat)
  useEffect(() => {
    if (!startVal || !endVal) { setClientError(null); return; }
    const tStart = new Date(startVal);
    const tEnd = new Date(endVal);

    if (tStart >= tEnd) {
      setClientError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    const overlap = bookedSlots.some((slot) => {
      const sStart = new Date(slot.start);
      const sEnd = new Date(slot.end);
      return tStart < sEnd && tEnd > sStart;
    });

    setClientError(overlap ? "⚠️ Ce créneau chevauche une réservation existante." : null);
  }, [startVal, endVal, bookedSlots]);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDate = now.toISOString().slice(0, 16);

  const hasError = !!clientError;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="roomId" value={roomId} />

      {/* Erreur serveur */}
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium">
          {state.error}
        </div>
      )}

      {/* Erreur client (chevauchement détecté immédiatement) */}
      {clientError && (
        <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg text-center font-medium">
          {clientError}
        </div>
      )}

      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg text-center font-medium">
          ✅ Réservation confirmée ! Redirection...
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Heure de début <span className="text-red-400">*</span>
        </label>
        <input
          type="datetime-local"
          name="startTime"
          required
          min={minDate}
          value={startVal}
          onChange={(e) => setStartVal(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all sm:text-sm text-gray-500 ${
            hasError ? "border-orange-300 focus:ring-orange-300" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Heure de fin <span className="text-red-400">*</span>
        </label>
        <input
          type="datetime-local"
          name="endTime"
          required
          min={minDate}
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all sm:text-sm text-gray-500 ${
            hasError ? "border-orange-300 focus:ring-orange-300" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
        <input
          type="text"
          name="purpose"
          placeholder="Ex: Point d'équipe technique"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all sm:text-sm text-gray-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state.success || hasError}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {isPending ? "Vérification..." : "Confirmer la réservation"}
      </button>

      {/* Légende des créneaux bloqués */}
      {bookedSlots.length > 0 && (
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Les créneaux en rouge sur la gauche sont déjà réservés. Le formulaire vous avertira en cas de conflit.
        </p>
      )}
    </form>
  );
}
