export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getDashboardStats } from "@/lib/actions/stats";
import { formatDuration, formatDate } from "@/lib/utils";
import PeriodToggle from "@/components/dashboard/PeriodToggle";
import ExportButton from "@/components/dashboard/ExportButton";

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { period: periodStr } = await searchParams;
  const period = periodStr === "7" ? 7 : periodStr === "90" ? 90 : 30;

  const stats = await getDashboardStats(period);

  const noData = stats.totalDays === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {formatDate(stats.startDate)} – {formatDate(stats.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Suspense>
            <PeriodToggle />
          </Suspense>
        </div>
      </div>

      {noData ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500 text-sm">No surgical days recorded in the last {period} days.</p>
        </div>
      ) : (
        <>
          {/* Overall summary */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Surgery Days" value={stats.totalDays} />
              <StatCard label="Total Cases" value={stats.totalCases} />
              <StatCard label="Active Surgeons" value={stats.activeSurgeons} />
              <StatCard label="Avg Technicians" value={stats.avgTechnicians.toFixed(1)} />
              <StatCard
                label="Orthopedic"
                value={stats.orthoCases}
                sub={stats.totalCases > 0 ? `${Math.round((stats.orthoCases / stats.totalCases) * 100)}%` : undefined}
                accent="blue"
              />
              <StatCard
                label="Soft Tissue"
                value={stats.softTissueCases}
                sub={stats.totalCases > 0 ? `${Math.round((stats.softTissueCases / stats.totalCases) * 100)}%` : undefined}
                accent="emerald"
              />
              {stats.totalDriveTime != null && (
                <StatCard label="Total Drive Time" value={formatDuration(stats.totalDriveTime)} />
              )}
              {stats.totalWorkingTime != null && (
                <StatCard label="Total Working Time" value={formatDuration(stats.totalWorkingTime)} />
              )}
            </div>
          </section>

          {/* Per-surgeon breakdown */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Surgeon</h2>
            <div className="space-y-4">
              {stats.surgeonStats.map((s) => (
                <div key={s.surgeonId} className="card p-4 space-y-3">
                  {/* Surgeon name + top-line */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{s.surgeonName}</p>
                    <div className="flex gap-2">
                      {s.orthoCases > 0 && <span className="badge-ortho">{s.orthoCases} ortho</span>}
                      {s.softTissueCases > 0 && <span className="badge-soft">{s.softTissueCases} soft tissue</span>}
                    </div>
                  </div>

                  {/* Primary metrics grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="metric-card">
                      <p className="text-xs text-slate-500 mb-0.5">Days</p>
                      <p className="text-base font-bold text-slate-900">{s.daysWorked}</p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs text-slate-500 mb-0.5">Cases</p>
                      <p className="text-base font-bold text-slate-900">{s.totalCases}</p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs text-slate-500 mb-0.5">Avg / Day</p>
                      <p className="text-base font-bold text-slate-900">
                        {s.avgCasesPerDay.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Timing metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="metric-card">
                      <p className="text-xs text-slate-500 mb-0.5">Avg Surgery</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDuration(s.avgSurgeryDuration)}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs text-slate-500 mb-0.5">Avg Turnaround</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDuration(s.avgTurnaroundTime)}
                      </p>
                    </div>
                    {s.totalDriveTime != null && (
                      <div className="metric-card">
                        <p className="text-xs text-slate-500 mb-0.5">Drive Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDuration(s.totalDriveTime)}
                        </p>
                      </div>
                    )}
                    {s.totalWorkingTime != null && (
                      <div className="metric-card">
                        <p className="text-xs text-slate-500 mb-0.5">Working Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDuration(s.totalWorkingTime)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer line */}
                  <div className="flex gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
                    <span>{s.clinicsVisited} clinic visit{s.clinicsVisited !== 1 ? "s" : ""}</span>
                    <span>{s.totalTechnicians} technician slot{s.totalTechnicians !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "emerald";
}) {
  const valueColor =
    accent === "blue"
      ? "text-blue-700"
      : accent === "emerald"
      ? "text-emerald-700"
      : "text-slate-900";

  return (
    <div className="metric-card flex items-center justify-between px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="text-right">
        <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
