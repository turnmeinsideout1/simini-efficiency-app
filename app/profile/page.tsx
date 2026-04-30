export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { UpdateNameForm, ChangePasswordForm, SignOutSection } from "./_components";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">My Profile</h1>

      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Account Details</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Practice</dt>
            <dd className="font-medium text-slate-900">{user.practice.name}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Display Name</h2>
        <UpdateNameForm currentName={user.name} />
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Change Password</h2>
        <ChangePasswordForm />
      </div>

      <div className="card p-5">
        <SignOutSection />
      </div>
    </div>
  );
}
