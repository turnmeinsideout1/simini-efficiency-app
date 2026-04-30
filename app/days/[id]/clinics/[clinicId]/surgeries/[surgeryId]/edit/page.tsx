export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurgeryCase, updateSurgeryCase } from "@/lib/actions/surgeries";
import { getSurgeons } from "@/lib/actions/surgeons";
import { getSurgeryTypes } from "@/lib/actions/surgery-types";
import SurgeryCaseForm from "@/components/forms/SurgeryCaseForm";

interface Props {
  params: Promise<{ id: string; clinicId: string; surgeryId: string }>;
}

export default async function EditSurgeryPage({ params }: Props) {
  const { id, clinicId, surgeryId } = await params;
  const [sc, surgeons, surgeryTypes] = await Promise.all([
    getSurgeryCase(surgeryId),
    getSurgeons(),
    getSurgeryTypes(),
  ]);

  if (!sc) notFound();

  const updateAction = updateSurgeryCase.bind(null, surgeryId, clinicId, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/days/${id}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Case: {sc.patientName}</h1>
          <p className="text-sm text-slate-500">{sc.clinicVisit.clinicName}</p>
        </div>
      </div>

      <div className="card p-5">
        <SurgeryCaseForm
          surgeons={surgeons}
          surgeryTypes={surgeryTypes}
          surgeryCase={sc}
          action={updateAction}
          submitLabel="Save Changes"
          cancelHref={`/days/${id}`}
        />
      </div>
    </div>
  );
}
