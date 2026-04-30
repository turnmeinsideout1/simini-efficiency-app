import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-brand-600 font-bold text-base tracking-tight leading-tight">
            Simini<br />
            <span className="text-xs font-normal text-slate-400">Efficiency App 3.0</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link href="/" className="btn-ghost text-xs whitespace-nowrap">Calendar</Link>
          <Link href="/days" className="btn-ghost text-xs whitespace-nowrap">Days</Link>
          <Link href="/dashboard" className="btn-ghost text-xs whitespace-nowrap">Dashboard</Link>
          <Link href="/settings/surgeons" className="btn-ghost text-xs whitespace-nowrap">Surgeons</Link>
          <Link href="/settings/clinics" className="btn-ghost text-xs whitespace-nowrap">Clinics</Link>
          {user && (
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold shrink-0 hover:bg-brand-700 transition-colors ml-1"
              aria-label="My profile"
            >
              {user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
