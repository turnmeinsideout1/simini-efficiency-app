"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClinicVisit } from "@prisma/client";
import { toTimeInput } from "@/lib/utils";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  clinic?: ClinicVisit;
  referringClinics: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}

export default function ClinicVisitForm({ clinic, referringClinics, action, submitLabel, cancelHref }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(clinic?.clinicName ?? "");
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <label className="form-label" htmlFor="clinicName">Clinic</label>
        {referringClinics.length > 0 ? (
          <select
            id="clinicName"
            name="clinicName"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            required
            className="form-select"
          >
            <option value="" disabled>Select clinic…</option>
            {referringClinics.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              id="clinicName"
              name="clinicName"
              type="text"
              defaultValue={clinic?.clinicName ?? ""}
              placeholder="e.g. Riverside Animal Hospital"
              required
              className="form-input"
            />
            <p className="text-xs text-slate-400 mt-1">
              Add clinics in{" "}
              <a href="/settings/clinics" className="text-brand-600 hover:underline">Settings → Clinics</a>{" "}
              to get a dropdown here.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="arrivalTime">Arrival Time</label>
          <input id="arrivalTime" name="arrivalTime" type="time" defaultValue={clinic?.arrivalTime ? toTimeInput(clinic.arrivalTime) : ""} className="form-input" />
        </div>
        <div>
          <label className="form-label" htmlFor="readyToLeaveTime">
            Ready to Leave
            <span className="ml-1 text-xs font-normal text-slate-400">(auto from last case)</span>
          </label>
          <input id="readyToLeaveTime" name="readyToLeaveTime" type="time" defaultValue={clinic?.readyToLeaveTime ? toTimeInput(clinic.readyToLeaveTime) : ""} className="form-input" />
        </div>
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
