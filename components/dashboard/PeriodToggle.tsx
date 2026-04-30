"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

export default function PeriodToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") || "30";

  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => router.push(`/dashboard?period=${value}`)}
          className={[
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            current === String(value)
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
