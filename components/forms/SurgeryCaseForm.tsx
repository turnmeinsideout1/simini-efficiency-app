"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Surgeon, SurgeryCase } from "@prisma/client";
import { toTimeInput, formatTime } from "@/lib/utils";
import SubmitButton from "@/components/ui/SubmitButton";

interface SurgeryTypeOption {
  id: string;
  name: string;
  category: "ORTHOPEDIC" | "SOFT_TISSUE";
}

interface Props {
  surgeons: Surgeon[];
  surgeryTypes: SurgeryTypeOption[];
  defaultSurgeonId?: string;
  surgeryCase?: SurgeryCase;
  clinicArrivalTime?: Date | null;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}

export default function SurgeryCaseForm({
  surgeons, surgeryTypes, defaultSurgeonId, surgeryCase, clinicArrivalTime, action, submitLabel, cancelHref,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<"ORTHOPEDIC" | "SOFT_TISSUE">(
    surgeryCase?.surgeryCategory ?? "SOFT_TISSUE"
  );
  const [error, setError] = useState<string | null>(null);

  // Initialise tech count from the saved case, or from the pre-selected surgeon's default
  const initialSurgeonId = surgeryCase?.surgeonId ?? defaultSurgeonId ?? "";
  const initialTechs =
    surgeryCase?.numTechnicians ??
    surgeons.find((s) => s.id === initialSurgeonId)?.defaultTechnicians ??
    1;
  const [numTechs, setNumTechs] = useState<number>(initialTechs);

  const filteredTypes = surgeryTypes.filter((t) => t.category === category);

  function handleSurgeonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const surgeon = surgeons.find((s) => s.id === e.target.value);
    if (surgeon) setNumTechs(surgeon.defaultTechnicians ?? 1);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        router.push(cancelHref);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Patient</h3>
          {clinicArrivalTime && (
            <span className="text-xs text-slate-500">
              Clinic arrival: <span className="font-medium text-slate-700">{formatTime(clinicArrivalTime)}</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="patientName">Patient Name</label>
            <input id="patientName" name="patientName" type="text" defaultValue={surgeryCase?.patientName ?? ""} placeholder="e.g. Max" required className="form-input" />
          </div>
          <div>
            <label className="form-label" htmlFor="patientWeight">Weight (lbs)</label>
            <input id="patientWeight" name="patientWeight" type="number" step="0.1" min="0" defaultValue={surgeryCase?.patientWeight ?? ""} placeholder="e.g. 62" className="form-input" />
          </div>
        </div>
      </div>

      {/* Staff */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Staff</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="surgeonId">Surgeon</label>
            <select
              id="surgeonId"
              name="surgeonId"
              defaultValue={initialSurgeonId}
              required
              className="form-select"
              onChange={handleSurgeonChange}
            >
              <option value="" disabled>Select surgeon…</option>
              {surgeons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="numTechnicians">Technicians</label>
            <input
              id="numTechnicians"
              name="numTechnicians"
              type="number"
              min="0"
              max="10"
              value={numTechs}
              onChange={(e) => setNumTechs(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Surgery */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Surgery</h3>
        <div>
          <label className="form-label">Category</label>
          <div className="grid grid-cols-2 gap-3">
            {(["ORTHOPEDIC", "SOFT_TISSUE"] as const).map((cat) => (
              <label
                key={cat}
                className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${
                  category === cat
                    ? cat === "ORTHOPEDIC" ? "border-blue-500 bg-blue-50" : "border-emerald-500 bg-emerald-50"
                    : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="surgeryCategory"
                  value={cat}
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  className="text-brand-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  {cat === "ORTHOPEDIC" ? "Orthopedic" : "Soft Tissue"}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="surgeryType">Surgery Type</label>
          <select
            id="surgeryType"
            name="surgeryType"
            defaultValue={surgeryCase?.surgeryType ?? ""}
            required
            className="form-select"
          >
            <option value="" disabled>Select type…</option>
            {filteredTypes.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Times */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Times</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="incisionStartTime">Incision Start</label>
            <input id="incisionStartTime" name="incisionStartTime" type="time" defaultValue={surgeryCase?.incisionStartTime ? toTimeInput(surgeryCase.incisionStartTime) : ""} className="form-input" />
          </div>
          <div>
            <label className="form-label" htmlFor="endOfSutureTime">End of Suture</label>
            <input id="endOfSutureTime" name="endOfSutureTime" type="time" defaultValue={surgeryCase?.endOfSutureTime ? toTimeInput(surgeryCase.endOfSutureTime) : ""} className="form-input" />
          </div>
          <div className="col-span-2">
            <label className="form-label" htmlFor="readyTime">
              Ready for Next / Leave
              <span className="ml-1 text-xs font-normal text-slate-400">(auto-fills clinic departure if last case)</span>
            </label>
            <input id="readyTime" name="readyTime" type="time" defaultValue={surgeryCase?.readyTime ? toTimeInput(surgeryCase.readyTime) : ""} className="form-input" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="form-label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={surgeryCase?.notes ?? ""} placeholder="Optional case notes…" className="form-textarea" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton label={submitLabel} pending={isPending} />
        <a href={cancelHref} className="btn-secondary flex-1 text-center">Cancel</a>
      </div>
    </form>
  );
}
