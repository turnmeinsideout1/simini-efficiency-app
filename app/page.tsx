export const dynamic = "force-dynamic";

import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, getDate } from "date-fns";
import { getDaysForMonth } from "@/lib/actions/days";
import { getSurgeonColor } from "@/lib/surgeon-colors";
import { getTodayString } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { month } = await searchParams;

  // Determine the month to display
  const todayString = getTodayString(); // "yyyy-MM-dd" in Pacific time
  const currentYearMonth = month || todayString.slice(0, 7);
  const [year, monthNum] = currentYearMonth.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);

  // Prev / next month strings
  const prevMonth = format(new Date(year, monthNum - 2, 1), "yyyy-MM");
  const nextMonth = format(new Date(year, monthNum, 1), "yyyy-MM");

  // Fetch all surgical days in this month
  const surgicalDays = await getDaysForMonth(currentYearMonth);

  // Build a map: "yyyy-MM-dd" → array of surgical days
  const dayMap = new Map<string, typeof surgicalDays>();
  for (const day of surgicalDays) {
    const key = (day.date as Date).toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(day);
  }

  // Build calendar grid (Sunday → Saturday, padded to full weeks)
  const gridStart = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/?month=${prevMonth}`} className="btn-secondary px-3 py-2 text-sm">←</Link>
          <h1 className="text-xl font-bold text-slate-900">
            {format(monthStart, "MMMM yyyy")}
          </h1>
          <Link href={`/?month=${nextMonth}`} className="btn-secondary px-3 py-2 text-sm">→</Link>
        </div>
        <Link href="/days/new" className="btn-primary text-sm">+ New Day</Link>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {allDays.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, monthStart);
            const today = dateKey === todayString;
            const entries = dayMap.get(dateKey) || [];
            const hasActivity = entries.length > 0;
            const totalCases = entries.reduce(
              (sum, d) => sum + d.clinicVisits.reduce((s, c) => s + c.surgeryCases.length, 0),
              0
            );

            const cell = (
              <div
                className={[
                  "min-h-[80px] p-1.5 border-b border-r border-slate-100",
                  !inMonth ? "bg-slate-50" : "bg-white",
                  hasActivity && inMonth ? "hover:bg-brand-50 cursor-pointer transition-colors" : "",
                  i % 7 === 6 ? "border-r-0" : "",
                ].join(" ")}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={[
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                      today ? "bg-brand-600 text-white" : inMonth ? "text-slate-700" : "text-slate-300",
                    ].join(" ")}
                  >
                    {getDate(day)}
                  </span>
                </div>

                {/* Activity entries */}
                {hasActivity && inMonth && (
                  <div className="space-y-0.5">
                    {entries.slice(0, 2).map((d) => {
                      const cases = d.clinicVisits.reduce((s, c) => s + c.surgeryCases.length, 0);
                      const color = getSurgeonColor(d.primarySurgeon.color);
                      return (
                        <div
                          key={d.id}
                          className="rounded px-1.5 py-0.5 text-xs leading-tight"
                          style={color
                            ? { backgroundColor: color.bg, borderColor: color.border, border: "1px solid" }
                            : { backgroundColor: "#dbeafe", borderColor: "#93c5fd", border: "1px solid" }
                          }
                        >
                          <span className="font-medium truncate block" style={{ color: color?.text ?? "#1e40af" }}>
                            {d.primarySurgeon.name.replace("Dr. ", "")}
                          </span>
                          <span style={{ color: color?.text ?? "#1e40af", opacity: 0.8 }}>
                            {cases} case{cases !== 1 ? "s" : ""}
                          </span>
                        </div>
                      );
                    })}
                    {entries.length > 2 && (
                      <p className="text-xs text-slate-400 pl-1">+{entries.length - 2} more</p>
                    )}
                  </div>
                )}
              </div>
            );

            return hasActivity && inMonth ? (
              <Link key={dateKey} href={`/calendar/${dateKey}`}>
                {cell}
              </Link>
            ) : (
              <div key={dateKey}>{cell}</div>
            );
          })}
        </div>
      </div>

      {/* Month summary strip */}
      {surgicalDays.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card">
            <p className="text-xs text-slate-500 mb-0.5">Surgery Days</p>
            <p className="text-lg font-bold text-slate-900">{surgicalDays.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-slate-500 mb-0.5">Total Cases</p>
            <p className="text-lg font-bold text-slate-900">
              {surgicalDays.reduce((s, d) => s + d.clinicVisits.reduce((cs, c) => cs + c.surgeryCases.length, 0), 0)}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs text-slate-500 mb-0.5">Surgeons</p>
            <p className="text-lg font-bold text-slate-900">
              {new Set(surgicalDays.map((d) => d.primarySurgeonId)).size}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
