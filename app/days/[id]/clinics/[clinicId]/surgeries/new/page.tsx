export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getClinicVisit } from "@/lib/actions/clinics";
import { getDay } from "@/lib/actions/days";
import { createSurgeryCase } from "@/lib/actions/surgeries";
import { getSurgeons } from "@/lib/actions/surgeons";
import { getSurgeryTypes } from "@/lib/actions/surgery-types";
import SurgeryCaseForm from "@/components/forms/SurgeryCaseForm";

interface Props {
  params: Promise<{ id: string; clinicId: string }>;
}

export default async function NewSurgeryPage({ params }: Props) {
  const { id, clinicId } = await params;
  const [clinic, day, surgeons, surgeryTypes] = await Promise.all([
    getClinicVisit(clinicId),
    getDay(id),
    getSurgeons(),
    getSurgeryTypes(),
  ]);

  if (!clinic || !day) notFound();

  const createAction = createSurgeryCase.bind(null, clinicId, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/days/${id}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add Surgery Case</h1>
          <p className="text-sm text-slate-500">{clinic.clinicName}</p>
        </div>
      </div>

      <div className="card p-5">
        <SurgeryCaseForm
          surgeons={surgeons}
          surgeryTypes={surgeryTypes}
          defaultSurgeonId={day.primarySurgeonId}
          clinicArrivalTime={clinic.arrivalTime}
          action={createAction}
          submitLabel="Add Case"
          cancelHref={`/days/${id}`}
        />
      </div>
    </div>
  );
}
