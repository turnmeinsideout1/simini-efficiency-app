export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getReferringClinics, createReferringClinic, updateReferringClinic, deleteReferringClinic, importClinicsFromCsv } from "@/lib/actions/referring-clinics";
import DeleteButton from "@/components/ui/DeleteButton";
import CsvUpload from "@/components/settings/CsvUpload";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function ClinicsPage({ searchParams }: Props) {
  await requireUser();
  const { onboarding } = await searchParams;
  const isOnboarding = onboarding === "1";
  const clinics = await getReferringClinics();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {isOnboarding ? (
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">Setup — Step 2 of 2</p>
            <h1 className="text-xl font-bold text-slate-900">Add Your Clinics</h1>
            <p className="text-sm text-slate-500 mt-0.5">Add clinics manually or import a CSV, then start using the app.</p>
          </div>
        ) : (
          <>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Referring Clinics</h1>
              <p className="text-sm text-slate-500">{clinics.length} clinic{clinics.length !== 1 ? "s" : ""}</p>
            </div>
          </>
        )}
      </div>

      {/* Add single clinic */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Clinic</h2>
        <form action={createReferringClinic} className="flex gap-3">
          <input name="name" type="text" placeholder="Clinic name…" required className="form-input flex-1" />
          <SubmitButton label="Add" pendingLabel="Adding…" className="btn-primary shrink-0" />
        </form>
      </div>

      {/* CSV upload */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Import from CSV</h2>
        <p className="text-xs text-slate-400 mb-3">One clinic name per row. Header row is ignored.</p>
        <CsvUpload action={importClinicsFromCsv} />
      </div>

      {/* Onboarding: quick-finish when clinics already exist */}
      {isOnboarding && clinics.length > 0 && (
        <Link href="/" className="btn-primary w-full text-center block">
          Done — Start Using the App →
        </Link>
      )}

      {/* Clinic list */}
      <div className="card divide-y divide-slate-100">
        {clinics.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No clinics yet. Add one above or import a CSV.</p>
          </div>
        ) : (
          clinics.map((clinic) => {
            const updateAction = updateReferringClinic.bind(null, clinic.id);
            const deleteAction = deleteReferringClinic.bind(null, clinic.id);
            return (
              <div key={clinic.id} className="p-4">
                <form action={updateAction} className="flex gap-2 items-center">
                  <input name="name" type="text" defaultValue={clinic.name} className="form-input flex-1 text-sm" />
                  <button type="submit" className="btn-secondary text-xs shrink-0">Save</button>
                  <DeleteButton
                    action={deleteAction}
                    confirm={`Remove ${clinic.name}?`}
                    className="btn-ghost text-xs text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                    label="Remove"
                  />
                </form>
              </div>
            );
          })
        )}
      </div>

      {/* Onboarding: finish setup */}
      {isOnboarding && (
        <Link href="/" className="btn-primary w-full text-center block">
          {clinics.length > 0 ? "Done — Start Using the App →" : "Skip for Now →"}
        </Link>
      )}
    </div>
  );
}
