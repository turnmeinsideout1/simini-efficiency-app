export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSurgeon, updateSurgeon, deleteSurgeon, getSurgeons } from "@/lib/actions/surgeons";
import DeleteButton from "@/components/ui/DeleteButton";
import ColorPicker from "@/components/settings/ColorPicker";
import SubmitButton from "@/components/ui/SubmitButton";

interface Props {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function SurgeonsPage({ searchParams }: Props) {
  await requireUser();
  const { onboarding } = await searchParams;
  const isOnboarding = onboarding === "1";
  const surgeons = await getSurgeons();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {isOnboarding ? (
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-0.5">Setup — Step 1 of 2</p>
            <h1 className="text-xl font-bold text-slate-900">Add Your Surgeons</h1>
            <p className="text-sm text-slate-500 mt-0.5">Add each surgeon, then continue to set up clinics.</p>
          </div>
        ) : (
          <>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <h1 className="text-xl font-bold text-slate-900">Surgeons</h1>
          </>
        )}
      </div>

      {/* Add surgeon */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Add Surgeon</h2>
        <form action={createSurgeon} className="space-y-3">
          {isOnboarding && <input type="hidden" name="onboarding" value="1" />}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label" htmlFor="add-name">Name</label>
              <input id="add-name" name="name" type="text" placeholder="Full name…" required className="form-input" />
            </div>
            <div>
              <label className="form-label" htmlFor="add-defaultTechnicians">Default Techs</label>
              <input id="add-defaultTechnicians" name="defaultTechnicians" type="number" min="0" max="10" defaultValue={1} className="form-input" />
            </div>
          </div>
          <ColorPicker name="color" selected={null} />
          <SubmitButton label="Add Surgeon" pendingLabel="Adding…" className="btn-primary w-full" />
        </form>
      </div>

      {/* Surgeon list */}
      <div className="card divide-y divide-slate-100">
        {surgeons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No surgeons yet. Add one above.</p>
          </div>
        ) : (
          surgeons.map((surgeon) => {
            const updateAction = updateSurgeon.bind(null, surgeon.id);
            const deleteAction = deleteSurgeon.bind(null, surgeon.id);
            return (
              <div key={surgeon.id} className="p-4 space-y-3">
                <form action={updateAction} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="form-label text-xs">Name</label>
                      <input name="name" type="text" defaultValue={surgeon.name} className="form-input text-sm" />
                    </div>
                    <div>
                      <label className="form-label text-xs">Default Techs</label>
                      <input name="defaultTechnicians" type="number" min="0" max="10" defaultValue={surgeon.defaultTechnicians} className="form-input text-sm" />
                    </div>
                  </div>
                  <ColorPicker name="color" selected={surgeon.color} />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-secondary text-xs">Save</button>
                    <DeleteButton
                      action={deleteAction}
                      confirm={`Remove ${surgeon.name}?`}
                      className="btn-ghost text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      label="Remove"
                    />
                  </div>
                </form>
              </div>
            );
          })
        )}
      </div>

      {/* Onboarding: continue to clinics */}
      {isOnboarding && surgeons.length > 0 && (
        <Link href="/settings/clinics?onboarding=1" className="btn-primary w-full text-center block">
          Continue to Clinics →
        </Link>
      )}
    </div>
  );
}
