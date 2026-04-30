export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getDay } from "@/lib/actions/days";
import { createClinicVisit } from "@/lib/actions/clinics";
import { getReferringClinics } from "@/lib/actions/referring-clinics";
import ClinicVisitForm from "@/components/forms/ClinicVisitForm";
import { formatDateLong } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewClinicPage({ params }: Props) {
  const { id } = await params;
  const [day, referringClinics] = await Promise.all([getDay(id), getReferringClinics()]);
  if (!day) notFound();

  const createAction = createClinicVisit.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/days/${id}`} className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add Clinic Visit</h1>
          <p className="text-sm text-slate-500">{formatDateLong(day.date)}</p>
        </div>
      </div>
      <div className="card p-5">
        <ClinicVisitForm referringClinics={referringClinics} action={createAction} submitLabel="Add Clinic" cancelHref={`/days/${id}`} />
      </div>
    </div>
  );
}
