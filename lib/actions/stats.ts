"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calcDayMetrics, type SurgicalDayWithRelations } from "@/lib/calculations";
import { minutesBetween, getTodayString } from "@/lib/utils";

export interface SurgeonStats {
  surgeonId: string;
  surgeonName: string;
  daysWorked: number;
  totalCases: number;
  orthoCases: number;
  softTissueCases: number;
  totalTechnicians: number;
  avgCasesPerDay: number;
  avgSurgeryDuration: number | null;   // minutes
  avgTurnaroundTime: number | null;    // minutes
  totalDriveTime: number | null;       // minutes
  totalWorkingTime: number | null;     // minutes
  clinicsVisited: number;
}

export interface DashboardStats {
  period: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalCases: number;
  orthoCases: number;
  softTissueCases: number;
  totalTechnicians: number;
  avgTechnicians: number;
  activeSurgeons: number;
  totalDriveTime: number | null;
  totalWorkingTime: number | null;
  surgeonStats: SurgeonStats[];
}

export async function getDashboardStats(period: number): Promise<DashboardStats> {
  const user = await requireUser();

  const [ey, em, ed] = getTodayString().split("-").map(Number);
  const endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
  const startDate = new Date(ey, em - 1, ed - (period - 1), 0, 0, 0, 0);

  const days = await prisma.surgicalDay.findMany({
    where: { practiceId: user.practiceId, date: { gte: startDate, lte: endDate } },
    include: {
      primarySurgeon: true,
      clinicVisits: {
        include: {
          surgeryCases: {
            include: { surgeon: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  // Group days by primary surgeon
  const bySurgeon = new Map<string, { name: string; days: typeof days }>();

  for (const day of days) {
    const key = day.primarySurgeonId;
    if (!bySurgeon.has(key)) {
      bySurgeon.set(key, { name: day.primarySurgeon.name, days: [] });
    }
    bySurgeon.get(key)!.days.push(day);
  }

  // Compute per-surgeon stats
  const surgeonStats: SurgeonStats[] = [];

  for (const [surgeonId, { name, days: surgeonDays }] of bySurgeon) {
    const allCases = surgeonDays.flatMap((d) => d.clinicVisits.flatMap((c) => c.surgeryCases));

    // Surgery durations (incision → end of suture)
    const durations = allCases
      .map((c) => minutesBetween(c.incisionStartTime, c.endOfSutureTime))
      .filter((v): v is number => v !== null && v > 0);

    // Turnaround times (end of suture → ready)
    const turnarounds = allCases
      .map((c) => minutesBetween(c.endOfSutureTime, c.readyTime))
      .filter((v): v is number => v !== null && v > 0);

    // Drive / working time from day metrics
    let totalDrive = 0;
    let hasDrive = false;
    let totalWorking = 0;
    let hasWorking = false;

    for (const day of surgeonDays) {
      const m = calcDayMetrics(day as SurgicalDayWithRelations);
      if (m.totalDriveTime != null) { totalDrive += m.totalDriveTime; hasDrive = true; }
      if (m.totalWorkingDay != null) { totalWorking += m.totalWorkingDay; hasWorking = true; }
    }

    const ortho = allCases.filter((c) => c.surgeryCategory === "ORTHOPEDIC").length;
    const soft = allCases.filter((c) => c.surgeryCategory === "SOFT_TISSUE").length;
    const techs = allCases.reduce((s, c) => s + c.numTechnicians, 0);
    const clinics = surgeonDays.reduce((s, d) => s + d.clinicVisits.length, 0);

    surgeonStats.push({
      surgeonId,
      surgeonName: name,
      daysWorked: surgeonDays.length,
      totalCases: allCases.length,
      orthoCases: ortho,
      softTissueCases: soft,
      totalTechnicians: techs,
      avgCasesPerDay: surgeonDays.length > 0 ? allCases.length / surgeonDays.length : 0,
      avgSurgeryDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      avgTurnaroundTime: turnarounds.length > 0 ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length : null,
      totalDriveTime: hasDrive ? totalDrive : null,
      totalWorkingTime: hasWorking ? totalWorking : null,
      clinicsVisited: clinics,
    });
  }

  // Sort by most cases
  surgeonStats.sort((a, b) => b.totalCases - a.totalCases);

  // Overall totals
  const allCasesGlobal = days.flatMap((d) => d.clinicVisits.flatMap((c) => c.surgeryCases));
  const allDriveTimes = surgeonStats.map((s) => s.totalDriveTime).filter((v): v is number => v !== null);
  const allWorkingTimes = surgeonStats.map((s) => s.totalWorkingTime).filter((v): v is number => v !== null);

  return {
    period,
    startDate,
    endDate,
    totalDays: days.length,
    totalCases: allCasesGlobal.length,
    orthoCases: allCasesGlobal.filter((c) => c.surgeryCategory === "ORTHOPEDIC").length,
    softTissueCases: allCasesGlobal.filter((c) => c.surgeryCategory === "SOFT_TISSUE").length,
    totalTechnicians: allCasesGlobal.reduce((s, c) => s + c.numTechnicians, 0),
    avgTechnicians: allCasesGlobal.length > 0
      ? allCasesGlobal.reduce((s, c) => s + c.numTechnicians, 0) / allCasesGlobal.length
      : 0,
    activeSurgeons: bySurgeon.size,
    totalDriveTime: allDriveTimes.length > 0 ? allDriveTimes.reduce((a, b) => a + b, 0) : null,
    totalWorkingTime: allWorkingTimes.length > 0 ? allWorkingTimes.reduce((a, b) => a + b, 0) : null,
    surgeonStats,
  };
}
