export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getDay, updateDay } from "@/lib/actions/days";
import { getSurgeons } from "@/lib/actions/surgeons";
import DayForm from "@/components/forms/DayForm";
import type { SurgicalDay } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDayPage({ params }: Props) {
  const { id } = await params;
  const [day, surgeons] = await Promise.all([getDay(id), getSurgeons()]);
  if (!day) notFound();

  const updateDayAction = updateDay.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/days/${id}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <h1 className="text-xl font-bold text-slate-900">Edit Day</h1>
      </div>

      <div className="card p-5">
        <DayForm
          surgeons={surgeons}
          day={day as SurgicalDay & { primarySurgeonId: string }}
          action={updateDayAction}
          submitLabel="Save Changes"
          cancelHref={`/days/${id}`}
        />
      </div>
    </div>
  );
}
