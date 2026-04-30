export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getDay, deleteDay } from "@/lib/actions/days";
import { formatDateLong } from "@/lib/utils";
import DaySummary from "@/components/days/DaySummary";
import DayTimeline from "@/components/days/DayTimeline";
import DeleteButton from "@/components/ui/DeleteButton";
import type { SurgicalDayWithRelations } from "@/lib/calculations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DayDetailPage({ params }: Props) {
  const { id } = await params;
  const day = await getDay(id);
  if (!day) notFound();

  const deleteDayAction = deleteDay.bind(null, id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← All Days</Link>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {formatDateLong(day.date)}
          </h1>
          <p className="text-sm text-slate-500">Dr. {day.primarySurgeon.name}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/days/${id}/edit`} className="btn-secondary text-xs">Edit</Link>
          <DeleteButton
            action={deleteDayAction}
            confirm="Delete this surgical day and all its data?"
            className="btn-danger text-xs"
            label="Delete"
          />
        </div>
      </div>

      {/* Summary metrics */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Day Summary</h2>
        <DaySummary day={day as SurgicalDayWithRelations} />
      </div>

      {/* Notes */}
      {day.notes && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{day.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Timeline</h2>
          <Link
            href={`/days/${id}/clinics/new`}
            className="btn-primary text-xs"
          >
            + Add Clinic
          </Link>
        </div>
        <DayTimeline day={day as SurgicalDayWithRelations} />
      </div>
    </div>
  );
}
