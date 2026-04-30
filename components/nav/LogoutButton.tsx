"use client";

import { logoutUser } from "@/lib/actions/auth";
import { useTransition } from "react";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutUser())}
      disabled={isPending}
      className="btn-ghost text-xs text-slate-400 hover:text-red-500 whitespace-nowrap"
    >
      {isPending ? "…" : "Sign out"}
    </button>
  );
}
