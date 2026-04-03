"use client";

import { useTransition } from "react";
import { deleteRoomAction } from "@/app/actions/rooms";

export default function DeleteRoomButton({ roomId, roomName }: { roomId: number; roomName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la salle "${roomName}" ?`)) {
      startTransition(() => {
        deleteRoomAction(roomId);
      });
    }
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="flex-1 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
    >
      {isPending ? "..." : "Supprimer"}
    </button>
  );
}
