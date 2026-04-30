export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDays } from "@/lib/actions/days";
import { formatDateLong, formatTime, formatDuration } from "@/lib/utils";
import { calcDayMetrics } from "@/lib/calculations";
import { surgeonCardStyle } from "@/lib/surgeon-colors";

export default async function DaysListPage() {
  const days = await getDays();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Surgical Days</h1>
          <p className="text-sm text-slate-500">{days.length} day{days.length !== 1 ? "s" : ""} recorded</p>
        </div>
        <Link href="/days/new" className="btn-primary">
          + New Day
        </Link>
      </div>

      {days.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500 text-sm mb-4">No surgical days yet.</p>
          <Link href="/days/new" className="btn-primary">
            Start your first day
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const metrics = calcDayMetrics(day as Parameters<typeof calcDayMetrics>[0]);
            const totalClinics = day.clinicVisits.length;
            const totalCases = day.clinicVisits.reduce((s, c) => s + c.surgeryCases.length, 0);

            return (
              <Link
                key={day.id}
                href={`/days/${day.id}`}
                className="card block p-4 hover:shadow-md transition-all"
                style={surgeonCardStyle(day.primarySurgeon.color)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {formatDateLong(day.date)}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{day.primarySurgeon.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-slate-700">
                      {totalCases} case{totalCases !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      {totalClinics} clinic{totalClinics !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {day.hqDepartureTime && (
                    <span>Depart {formatTime(day.hqDepartureTime)}</span>
                  )}
                  {day.hqReturnArrivalTime && (
                    <span>Return {formatTime(day.hqReturnArrivalTime)}</span>
                  )}
                  {metrics.totalWorkingDay && (
                    <span className="text-brand-600 font-medium">
                      {formatDuration(metrics.totalWorkingDay)} total
                    </span>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  {metrics.totalOrthopedic > 0 && (
                    <span className="badge-ortho">{metrics.totalOrthopedic} ortho</span>
                  )}
                  {metrics.totalSoftTissue > 0 && (
                    <span className="badge-soft">{metrics.totalSoftTissue} soft tissue</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
