"use client";

import { useRef, useState, useTransition } from "react";
import { updateProfile, updatePassword, logoutUser } from "@/lib/actions/auth";

export function UpdateNameForm({ currentName }: { currentName: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="form-label" htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          required
          minLength={2}
          className="form-input"
          placeholder="Your display name"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">Name updated.</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Saving…" : "Save Name"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="form-label" htmlFor="password">New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="form-input"
          placeholder="Min 8 characters"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="form-input"
          placeholder="Re-enter new password"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">Password updated.</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}

export function SignOutSection() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutUser())}
      disabled={isPending}
      className="btn-danger w-full"
    >
      {isPending ? "Signing out…" : "Sign Out"}
    </button>
  );
}
