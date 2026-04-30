export const dynamic = "force-dynamic";

import { getSurgeons } from "@/lib/actions/surgeons";
import { createDay } from "@/lib/actions/days";
import DayForm from "@/components/forms/DayForm";
import Link from "next/link";

export default async function NewDayPage() {
  const surgeons = await getSurgeons();

  if (surgeons.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
          <h1 className="text-xl font-bold text-slate-900">New Surgical Day</h1>
        </div>
        <div className="card p-8 text-center">
          <p className="text-slate-600 mb-4">No surgeons found. Add at least one surgeon before creating a day.</p>
          <Link href="/settings/surgeons" className="btn-primary">Manage Surgeons</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <h1 className="text-xl font-bold text-slate-900">New Surgical Day</h1>
      </div>

      <div className="card p-5">
        <DayForm
          surgeons={surgeons}
          action={createDay}
          submitLabel="Create Day"
          cancelHref="/"
        />
      </div>
    </div>
  );
}
