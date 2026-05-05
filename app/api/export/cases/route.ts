import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import {
  calcDayMetrics,
  calcClinicTime,
  calcSurgeryCaseMetrics,
  calcSetupTime,
} from "@/lib/calculations";
import { getTodayString } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "date",
  "day_id",
  "primary_surgeon",
  "hq_departure_time",
  "hq_return_arrival_time",
  "total_working_day_min",
  "total_drive_time_min",
  "clinic_name",
  "clinic_visit_id",
  "clinic_arrival_time",
  "clinic_ready_to_leave_time",
  "clinic_time_min",
  "drive_to_clinic_min",
  "case_id",
  "case_order_in_visit",
  "case_surgeon",
  "patient_name",
  "patient_weight",
  "num_technicians",
  "surgery_category",
  "surgery_type",
  "incision_start_time",
  "end_of_suture_time",
  "ready_time",
  "surgery_duration_min",
  "turnaround_time_min",
  "setup_time_min",
  "case_notes",
  "day_notes",
];

export async function GET() {
  const user = await requireUser();

  const days = await prisma.surgicalDay.findMany({
    where: { practiceId: user.practiceId },
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
    orderBy: { date: "asc" },
  });

  const rows: Record<string, unknown>[] = [];

  for (const day of days) {
    const dayMetrics = calcDayMetrics(day);
    const dateStr = day.date.toISOString().slice(0, 10);

    const visits = [...day.clinicVisits].sort((a, b) => {
      if (a.arrivalTime && b.arrivalTime) {
        return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
      }
      return a.order - b.order;
    });

    for (const visit of visits) {
      const driveLeg = dayMetrics.driveLegs.find((leg) => leg.to === visit.clinicName);
      const clinicTime = calcClinicTime(visit);

      visit.surgeryCases.forEach((c, idx) => {
        const prev = idx > 0 ? visit.surgeryCases[idx - 1] : null;
        const caseMetrics = calcSurgeryCaseMetrics(c);

        rows.push({
          date: dateStr,
          day_id: day.id,
          primary_surgeon: day.primarySurgeon.name,
          hq_departure_time: day.hqDepartureTime,
          hq_return_arrival_time: day.hqReturnArrivalTime,
          total_working_day_min: dayMetrics.totalWorkingDay,
          total_drive_time_min: dayMetrics.totalDriveTime,
          clinic_name: visit.clinicName,
          clinic_visit_id: visit.id,
          clinic_arrival_time: visit.arrivalTime,
          clinic_ready_to_leave_time: visit.readyToLeaveTime,
          clinic_time_min: clinicTime,
          drive_to_clinic_min: driveLeg?.durationMinutes ?? null,
          case_id: c.id,
          case_order_in_visit: c.order,
          case_surgeon: c.surgeon.name,
          patient_name: c.patientName,
          patient_weight: c.patientWeight,
          num_technicians: c.numTechnicians,
          surgery_category: c.surgeryCategory,
          surgery_type: c.surgeryType,
          incision_start_time: c.incisionStartTime,
          end_of_suture_time: c.endOfSutureTime,
          ready_time: c.readyTime,
          surgery_duration_min: caseMetrics.surgeryDuration,
          turnaround_time_min: caseMetrics.turnaroundTime,
          setup_time_min: prev ? calcSetupTime(prev, c) : null,
          case_notes: c.notes,
          day_notes: day.notes,
        });
      });
    }
  }

  const csv = toCsv(rows, COLUMNS);
  const filename = `timing-data-${getTodayString()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
