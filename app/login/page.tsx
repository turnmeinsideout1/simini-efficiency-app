"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginUser(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-600">Simini Efficiency App</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="form-input" placeholder="you@practice.com" />
            </div>
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="form-input" placeholder="••••••••" />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
