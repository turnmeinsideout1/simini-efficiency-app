export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getDaysForDate } from "@/lib/actions/days";
import { formatDateLong, formatTime, formatDuration } from "@/lib/utils";
import { calcDayMetrics } from "@/lib/calculations";
import type { SurgicalDayWithRelations } from "@/lib/calculations";
import { surgeonCardStyle } from "@/lib/surgeon-colors";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function CalendarDatePage({ params }: Props) {
  const { date } = await params;

  // Basic validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const days = await getDaysForDate(date);
  if (days.length === 0) notFound();

  const monthStr = date.slice(0, 7); // yyyy-MM for back link

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href={`/?month=${monthStr}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← {format(new Date(date + "T00:00:00"), "MMMM yyyy")}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-1">
          {formatDateLong(new Date(date + "T00:00:00"))}
        </h1>
        <p className="text-sm text-slate-500">
          {days.length} surgical team{days.length !== 1 ? "s" : ""} ·{" "}
          {days.reduce((s, d) => s + d.clinicVisits.reduce((cs, c) => cs + c.surgeryCases.length, 0), 0)} cases total
        </p>
      </div>

      {/* One card per surgical day */}
      {days.map((day) => {
        const metrics = calcDayMetrics(day as SurgicalDayWithRelations);
        const totalCases = day.clinicVisits.reduce((s, c) => s + c.surgeryCases.length, 0);
        const totalClinics = day.clinicVisits.length;

        return (
          <div key={day.id} className="card p-4 space-y-4" style={surgeonCardStyle(day.primarySurgeon.color)}>
            {/* Surgeon header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{day.primarySurgeon.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                  {day.hqDepartureTime && <span>Depart {formatTime(day.hqDepartureTime)}</span>}
                  {day.hqReturnArrivalTime && <span>Return {formatTime(day.hqReturnArrivalTime)}</span>}
                  {metrics.totalWorkingDay != null && (
                    <span className="text-brand-600 font-medium">{formatDuration(metrics.totalWorkingDay)} total</span>
                  )}
                </div>
              </div>
              <Link href={`/days/${day.id}`} className="btn-secondary text-xs shrink-0">
                Full Detail →
              </Link>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-4 gap-2">
              <div className="metric-card">
                <p className="text-xs text-slate-500 mb-0.5">Cases</p>
                <p className="text-base font-bold text-slate-900">{totalCases}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs text-slate-500 mb-0.5">Clinics</p>
                <p className="text-base font-bold text-slate-900">{totalClinics}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs text-blue-600 mb-0.5">Ortho</p>
                <p className="text-base font-bold text-blue-700">{metrics.totalOrthopedic}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs text-emerald-600 mb-0.5">Soft Tissue</p>
                <p className="text-base font-bold text-emerald-700">{metrics.totalSoftTissue}</p>
              </div>
            </div>

            {/* Clinic + case breakdown */}
            <div className="space-y-3">
              {day.clinicVisits.map((clinic) => {
                const cases = clinic.surgeryCases;
                return (
                  <div key={clinic.id} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">{clinic.clinicName}</p>
                      <div className="flex gap-2 text-xs text-slate-400">
                        {clinic.arrivalTime && <span>In {formatTime(clinic.arrivalTime)}</span>}
                        {clinic.readyToLeaveTime && <span>Out {formatTime(clinic.readyToLeaveTime)}</span>}
                      </div>
                    </div>
                    {cases.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No cases recorded</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cases.map((sc) => (
                          <div key={sc.id} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-700 w-24 truncate">{sc.patientName}</span>
                            {sc.patientWeight && (
                              <span className="text-slate-400">{sc.patientWeight}kg</span>
                            )}
                            {sc.surgeryCategory === "ORTHOPEDIC" ? (
                              <span className="badge-ortho">Ortho</span>
                            ) : (
                              <span className="badge-soft">Soft Tissue</span>
                            )}
                            <span className="text-slate-500 truncate flex-1">{sc.surgeryType}</span>
                            {sc.incisionStartTime && sc.endOfSutureTime && (
                              <span className="text-slate-400 shrink-0">
                                {formatTime(sc.incisionStartTime)}–{formatTime(sc.endOfSutureTime)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {day.notes && (
              <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">{day.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
