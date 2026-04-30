"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, getPractices } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [practiceAction, setPracticeAction] = useState<"create" | "join">("create");
  const [practices, setPractices] = useState<{ id: string; name: string }[]>([]);
  const [practiceName, setPracticeName] = useState("");

  useEffect(() => {
    getPractices().then(setPractices);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerUser(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(result.redirectTo ?? "/");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-600">Simini Efficiency App</h1>
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>

        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal details */}
            <div>
              <label className="form-label" htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" required className="form-input" placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="form-input" placeholder="you@practice.com" />
            </div>
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="form-input" placeholder="Min 8 characters" />
            </div>

            {/* Role */}
            <div>
              <label className="form-label">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {(["SURGEON", "STAFF"] as const).map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 px-3 py-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                    <input type="radio" name="role" value={r} defaultChecked={r === "STAFF"} className="text-brand-600" />
                    <span className="text-sm font-medium text-slate-700 capitalize">{r.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Practice */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="form-label">Practice</label>
              <div className="grid grid-cols-2 gap-2">
                {(["create", "join"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setPracticeAction(action)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      practiceAction === action
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {action === "create" ? "Create New" : "Join Existing"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="practiceAction" value={practiceAction} />

              {practiceAction === "join" && practices.length > 0 ? (
                <select
                  name="practiceName"
                  className="form-select"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  required
                >
                  <option value="">Select practice…</option>
                  {practices.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  name="practiceName"
                  type="text"
                  required
                  className="form-input"
                  placeholder={practiceAction === "create" ? "Practice name…" : "Practice name…"}
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                />
              )}

              <div>
                <label className="form-label" htmlFor="practicePassword">
                  {practiceAction === "create" ? "Set practice password" : "Practice password"}
                </label>
                <input
                  id="practicePassword"
                  name="practicePassword"
                  type="password"
                  required
                  minLength={4}
                  className="form-input"
                  placeholder={practiceAction === "create" ? "Share with team members" : "Enter team password"}
                />
                {practiceAction === "create" && (
                  <p className="text-xs text-slate-400 mt-1">Share this password with team members so they can join.</p>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
