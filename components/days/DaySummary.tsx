import { formatDuration, formatTime } from "@/lib/utils";
import { calcDayMetrics, type SurgicalDayWithRelations } from "@/lib/calculations";

interface Props {
  day: SurgicalDayWithRelations;
}

export default function DaySummary({ day }: Props) {
  const metrics = calcDayMetrics(day);

  return (
    <div className="space-y-4">
      {/* Key time metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Working Day</p>
          <p className="text-base font-bold text-slate-900">{formatDuration(metrics.totalWorkingDay)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Drive Time</p>
          <p className="text-base font-bold text-slate-900">{formatDuration(metrics.totalDriveTime)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Cases</p>
          <p className="text-base font-bold text-slate-900">{metrics.totalSurgeries}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Orthopedic</p>
          <p className="text-base font-bold text-blue-700">{metrics.totalOrthopedic}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Soft Tissue</p>
          <p className="text-base font-bold text-emerald-700">{metrics.totalSoftTissue}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 mb-0.5">Technicians</p>
          <p className="text-base font-bold text-slate-900">{metrics.totalTechnicians}</p>
        </div>
      </div>

      {/* Drive legs */}
      {metrics.driveLegs.length > 0 && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Drive Legs</p>
          <div className="space-y-1.5">
            {metrics.driveLegs.map((leg, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate mr-2">{leg.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {leg.departureTime && leg.arrivalTime && (
                    <span className="text-xs text-slate-400">
                      {formatTime(leg.departureTime)} → {formatTime(leg.arrivalTime)}
                    </span>
                  )}
                  <span className="font-medium text-slate-900 min-w-[3rem] text-right">
                    {formatDuration(leg.durationMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HQ times */}
      <div className="flex gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
          <span>HQ Depart {formatTime(day.hqDepartureTime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span>HQ Return {formatTime(day.hqReturnArrivalTime)}</span>
        </div>
      </div>
    </div>
  );
}
