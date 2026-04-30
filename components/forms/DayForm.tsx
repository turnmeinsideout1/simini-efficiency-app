"use client";

import { useRef } from "react";
import type { Surgeon, SurgicalDay } from "@prisma/client";
import { format } from "date-fns";
import { toTimeInput } from "@/lib/utils";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  surgeons: Surgeon[];
  day?: SurgicalDay & { primarySurgeonId: string };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}

export default function DayForm({ surgeons, day, action, submitLabel, cancelHref }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  // For existing days, extract the date from the UTC ISO string directly to avoid
  // timezone shifts (dates are stored at UTC noon so slice(0,10) is always correct).
  // For new days, use the local calendar date.
  const defaultDate = day
    ? new Date(day.date).toISOString().slice(0, 10)
    : format(new Date(), "yyyy-MM-dd");

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label" htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultDate}
            required
            className="form-input"
          />
        </div>

        <div className="col-span-2">
          <label className="form-label" htmlFor="primarySurgeonId">Primary Surgeon</label>
          <select
            id="primarySurgeonId"
            name="primarySurgeonId"
            defaultValue={day?.primarySurgeonId ?? ""}
            required
            className="form-select"
          >
            <option value="" disabled>Select surgeon…</option>
            {surgeons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="hqDepartureTime">HQ Departure</label>
          <input
            id="hqDepartureTime"
            name="hqDepartureTime"
            type="time"
            defaultValue={day?.hqDepartureTime ? toTimeInput(day.hqDepartureTime) : ""}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label" htmlFor="hqReturnArrivalTime">HQ Return Arrival</label>
          <input
            id="hqReturnArrivalTime"
            name="hqReturnArrivalTime"
            type="time"
            defaultValue={day?.hqReturnArrivalTime ? toTimeInput(day.hqReturnArrivalTime) : ""}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={day?.notes ?? ""}
          placeholder="Optional notes about the day…"
          className="form-textarea"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <a href={cancelHref} className="btn-secondary flex-1 text-center">Cancel</a>
      </div>
    </form>
  );
}
