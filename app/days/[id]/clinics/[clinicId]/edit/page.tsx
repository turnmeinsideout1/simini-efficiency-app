export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getClinicVisit, updateClinicVisit } from "@/lib/actions/clinics";
import { getReferringClinics } from "@/lib/actions/referring-clinics";
import ClinicVisitForm from "@/components/forms/ClinicVisitForm";

interface Props {
  params: Promise<{ id: string; clinicId: string }>;
}

export default async function EditClinicPage({ params }: Props) {
  const { id, clinicId } = await params;
  const [clinic, referringClinics] = await Promise.all([
    getClinicVisit(clinicId),
    getReferringClinics(),
  ]);
  if (!clinic) notFound();

  const updateAction = updateClinicVisit.bind(null, clinicId, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/days/${id}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <h1 className="text-xl font-bold text-slate-900">Edit Clinic: {clinic.clinicName}</h1>
      </div>

      <div className="card p-5">
        <ClinicVisitForm
          clinic={clinic}
          referringClinics={referringClinics}
          action={updateAction}
          submitLabel="Save Changes"
          cancelHref={`/days/${id}`}
        />
      </div>
    </div>
  );
}
