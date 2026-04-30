import { minutesBetween } from "./utils";
import type { SurgicalDay, ClinicVisit, SurgeryCase, Surgeon } from "@prisma/client";

export type SurgeryCaseWithSurgeon = SurgeryCase & {
  surgeon: Surgeon;
};

export type ClinicVisitWithSurgeries = ClinicVisit & {
  surgeryCases: SurgeryCaseWithSurgeon[];
};

export type SurgicalDayWithRelations = SurgicalDay & {
  clinicVisits: ClinicVisitWithSurgeries[];
};

// ─── Surgery Case Metrics ────────────────────────────────────────────────────

export interface SurgeryCaseMetrics {
  surgeryDuration: number | null;   // incisionStart → endOfSuture (mins)
  turnaroundTime: number | null;    // endOfSuture → readyTime (mins)
}

export function calcSurgeryCaseMetrics(c: SurgeryCase | SurgeryCaseWithSurgeon): SurgeryCaseMetrics {
  return {
    surgeryDuration: minutesBetween(c.incisionStartTime, c.endOfSutureTime),
    turnaroundTime: minutesBetween(c.endOfSutureTime, c.readyTime),
  };
}

/**
 * Setup time between two consecutive surgeries at the same clinic.
 * = previous surgery readyTime → next surgery incisionStartTime
 */
export function calcSetupTime(
  prev: SurgeryCase | SurgeryCaseWithSurgeon,
  next: SurgeryCase | SurgeryCaseWithSurgeon
): number | null {
  return minutesBetween(prev.readyTime, next.incisionStartTime);
}

// ─── Clinic Visit Metrics ────────────────────────────────────────────────────

export interface ClinicVisitMetrics {
  clinicTime: number | null;        // arrivalTime → readyToLeaveTime (mins)
  driveTimeToHere: number | null;   // calculated externally, passed in
}

export function calcClinicTime(cv: ClinicVisit): number | null {
  return minutesBetween(cv.arrivalTime, cv.readyToLeaveTime);
}

// ─── Day Metrics ─────────────────────────────────────────────────────────────

export interface DriveLeg {
  label: string;
  from: string;
  to: string;
  departureTime: Date | null;
  arrivalTime: Date | null;
  durationMinutes: number | null;
}

export interface DayMetrics {
  totalWorkingDay: number | null;
  totalDriveTime: number | null;
  totalSurgeries: number;
  totalOrthopedic: number;
  totalSoftTissue: number;
  totalTechnicians: number;
  driveLegs: DriveLeg[];
}

export function calcDayMetrics(day: SurgicalDayWithRelations): DayMetrics {
  const visits = [...day.clinicVisits].sort((a, b) => {
    if (a.arrivalTime && b.arrivalTime) {
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    }
    return a.order - b.order;
  });

  const driveLegs: DriveLeg[] = [];

  // Leg 1: HQ → first clinic
  if (visits.length > 0) {
    const firstClinic = visits[0];
    driveLegs.push({
      label: `HQ → ${firstClinic.clinicName}`,
      from: "Headquarters",
      to: firstClinic.clinicName,
      departureTime: day.hqDepartureTime,
      arrivalTime: firstClinic.arrivalTime,
      durationMinutes: minutesBetween(day.hqDepartureTime, firstClinic.arrivalTime),
    });
  }

  // Intermediate legs: clinic N → clinic N+1
  for (let i = 0; i < visits.length - 1; i++) {
    const from = visits[i];
    const to = visits[i + 1];
    driveLegs.push({
      label: `${from.clinicName} → ${to.clinicName}`,
      from: from.clinicName,
      to: to.clinicName,
      departureTime: from.readyToLeaveTime,
      arrivalTime: to.arrivalTime,
      durationMinutes: minutesBetween(from.readyToLeaveTime, to.arrivalTime),
    });
  }

  // Final leg: last clinic → HQ return
  if (visits.length > 0) {
    const lastClinic = visits[visits.length - 1];
    driveLegs.push({
      label: `${lastClinic.clinicName} → HQ`,
      from: lastClinic.clinicName,
      to: "Headquarters",
      departureTime: lastClinic.readyToLeaveTime,
      arrivalTime: day.hqReturnArrivalTime,
      durationMinutes: minutesBetween(lastClinic.readyToLeaveTime, day.hqReturnArrivalTime),
    });
  }

  const totalDriveTime = driveLegs.reduce<number | null>((sum, leg) => {
    if (leg.durationMinutes == null) return sum;
    return (sum ?? 0) + leg.durationMinutes;
  }, null);

  const allCases = visits.flatMap((v) => v.surgeryCases);

  const totalOrthopedic = allCases.filter((c) => c.surgeryCategory === "ORTHOPEDIC").length;
  const totalSoftTissue = allCases.filter((c) => c.surgeryCategory === "SOFT_TISSUE").length;
  const totalTechnicians = allCases.reduce((sum, c) => sum + c.numTechnicians, 0);

  return {
    totalWorkingDay: minutesBetween(day.hqDepartureTime, day.hqReturnArrivalTime),
    totalDriveTime,
    totalSurgeries: allCases.length,
    totalOrthopedic,
    totalSoftTissue,
    totalTechnicians,
    driveLegs,
  };
}
