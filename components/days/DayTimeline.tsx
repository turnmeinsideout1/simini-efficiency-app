import Link from "next/link";
import {
  formatTime,
  formatDuration,
} from "@/lib/utils";
import {
  calcSurgeryCaseMetrics,
  calcSetupTime,
  calcClinicTime,
  calcDayMetrics,
  type SurgicalDayWithRelations,
} from "@/lib/calculations";
import { deleteClinicVisit } from "@/lib/actions/clinics";
import { deleteSurgeryCase } from "@/lib/actions/surgeries";
import DeleteButton from "@/components/ui/DeleteButton";

interface Props {
  day: SurgicalDayWithRelations;
}

export default function DayTimeline({ day }: Props) {
  const metrics = calcDayMetrics(day);

  // Sort clinics by arrival time, fallback to order
  const sortedClinics = [...day.clinicVisits].sort((a, b) => {
    if (a.arrivalTime && b.arrivalTime) {
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    }
    return a.order - b.order;
  });

  return (
    <div className="relative">
      {/* HQ Departure */}
      <TimelineRow
        dotColor="bg-brand-600"
        label="HQ Departure"
        time={formatTime(day.hqDepartureTime)}
        isFirst
      />

      {sortedClinics.map((clinic, clinicIndex) => {
        const driveLeg = metrics.driveLegs[clinicIndex];
        const sortedCases = [...clinic.surgeryCases].sort((a, b) => a.order - b.order);
        const clinicTime = calcClinicTime(clinic);

        return (
          <div key={clinic.id}>
            {/* Drive leg indicator */}
            {driveLeg && driveLeg.durationMinutes != null && (
              <div className="flex items-center gap-3 py-1 pl-4">
                <div className="w-px h-6 bg-slate-200 ml-[3px]" />
                <span className="text-xs text-slate-400 italic">
                  Drive {formatDuration(driveLeg.durationMinutes)}
                </span>
              </div>
            )}

            {/* Clinic block */}
            <div className="relative pl-8 pb-1">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-5 bottom-0 w-px bg-slate-200" />

              {/* Dot */}
              <div className="absolute left-[7px] top-3.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-1 ring-amber-400" />

              <div className="card p-3">
                {/* Clinic header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{clinic.clinicName}</p>
                    <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                      <span>Arrive {formatTime(clinic.arrivalTime)}</span>
                      <span>Leave {formatTime(clinic.readyToLeaveTime)}</span>
                      {clinicTime != null && (
                        <span className="text-amber-600 font-medium">{formatDuration(clinicTime)} clinic time</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link
                      href={`/days/${day.id}/clinics/${clinic.id}/surgeries/new`}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      + Case
                    </Link>
                    <Link
                      href={`/days/${day.id}/clinics/${clinic.id}/edit`}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteClinicVisit.bind(null, clinic.id, day.id)}
                      confirm={`Delete ${clinic.clinicName}? This will remove all surgeries.`}
                      className="btn-ghost text-xs py-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      label="Delete"
                    />
                  </div>
                </div>

                {/* Surgery cases */}
                {sortedCases.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">No cases yet — add one above.</p>
                ) : (
                  <div className="space-y-2">
                    {sortedCases.map((sc, caseIndex) => {
                      const caseMetrics = calcSurgeryCaseMetrics(sc);
                      const prevCase = caseIndex > 0 ? sortedCases[caseIndex - 1] : null;
                      const setupTime = prevCase ? calcSetupTime(prevCase, sc) : null;

                      return (
                        <div key={sc.id}>
                          {/* Setup time between cases */}
                          {setupTime != null && (
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex-1 h-px bg-slate-100" />
                              <span className="text-xs text-slate-400">
                                Setup: {formatDuration(setupTime)}
                              </span>
                              <div className="flex-1 h-px bg-slate-100" />
                            </div>
                          )}

                          {/* Surgery card */}
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-slate-900 text-sm">
                                    {sc.patientName}
                                  </span>
                                  {sc.patientWeight && (
                                    <span className="text-xs text-slate-500">{sc.patientWeight} kg</span>
                                  )}
                                  {sc.surgeryCategory === "ORTHOPEDIC" ? (
                                    <span className="badge-ortho">Ortho</span>
                                  ) : (
                                    <span className="badge-soft">Soft Tissue</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">{sc.surgeryType}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Dr. {sc.surgeon.name} · {sc.numTechnicians} tech{sc.numTechnicians !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Link
                                  href={`/days/${day.id}/clinics/${clinic.id}/surgeries/${sc.id}/edit`}
                                  className="btn-ghost text-xs py-1 px-2"
                                >
                                  Edit
                                </Link>
                                <DeleteButton
                                  action={deleteSurgeryCase.bind(null, sc.id, clinic.id, day.id)}
                                  confirm={`Delete case for ${sc.patientName}?`}
                                  className="btn-ghost text-xs py-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  label="Delete"
                                />
                              </div>
                            </div>

                            {/* Times row */}
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                              {sc.incisionStartTime && (
                                <span>Incision {formatTime(sc.incisionStartTime)}</span>
                              )}
                              {sc.endOfSutureTime && (
                                <span>Suture end {formatTime(sc.endOfSutureTime)}</span>
                              )}
                              {sc.readyTime && (
                                <span>Ready {formatTime(sc.readyTime)}</span>
                              )}
                            </div>

                            {/* Duration metrics */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {caseMetrics.surgeryDuration != null && (
                                <span className="inline-flex items-center rounded bg-white border border-slate-200 px-2 py-0.5 text-xs">
                                  <span className="text-slate-500 mr-1">Surgery</span>
                                  <span className="font-semibold text-slate-800">{formatDuration(caseMetrics.surgeryDuration)}</span>
                                </span>
                              )}
                              {caseMetrics.turnaroundTime != null && (
                                <span className="inline-flex items-center rounded bg-white border border-slate-200 px-2 py-0.5 text-xs">
                                  <span className="text-slate-500 mr-1">Turnaround</span>
                                  <span className="font-semibold text-slate-800">{formatDuration(caseMetrics.turnaroundTime)}</span>
                                </span>
                              )}
                            </div>

                            {sc.notes && (
                              <p className="mt-2 text-xs text-slate-500 italic">{sc.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Final drive leg back to HQ */}
      {sortedClinics.length > 0 && metrics.driveLegs.length > sortedClinics.length - 1 && (
        (() => {
          const finalLeg = metrics.driveLegs[metrics.driveLegs.length - 1];
          return finalLeg.durationMinutes != null ? (
            <div className="flex items-center gap-3 py-1 pl-4">
              <div className="w-px h-6 bg-slate-200 ml-[3px]" />
              <span className="text-xs text-slate-400 italic">
                Drive {formatDuration(finalLeg.durationMinutes)}
              </span>
            </div>
          ) : null;
        })()
      )}

      {/* HQ Return */}
      <TimelineRow
        dotColor="bg-slate-400"
        label="HQ Return"
        time={formatTime(day.hqReturnArrivalTime)}
        isLast
      />
    </div>
  );
}

function TimelineRow({
  dotColor,
  label,
  time,
  isFirst,
  isLast,
}: {
  dotColor: string;
  label: string;
  time: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-3 py-2 pl-4">
      {!isFirst && <div className="absolute left-[11px] top-0 h-2 w-px bg-slate-200" />}
      <div className={`relative z-10 w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-white ring-1 ring-slate-300 shrink-0`} />
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-sm text-slate-500 ml-auto">{time}</span>
      {!isLast && <div className="absolute left-[11px] bottom-0 h-2 w-px bg-slate-200" />}
    </div>
  );
}
