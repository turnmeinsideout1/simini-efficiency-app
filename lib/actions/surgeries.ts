"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseTime } from "@/lib/utils";

const SurgeryCaseSchema = z.object({
  surgeonId: z.string().min(1, "Surgeon is required"),
  patientName: z.string().min(1, "Patient name is required").max(200),
  patientWeight: z.string().optional(),
  numTechnicians: z.string().default("1"),
  surgeryCategory: z.enum(["ORTHOPEDIC", "SOFT_TISSUE"]),
  surgeryType: z.string().min(1, "Surgery type is required").max(200),
  incisionStartTime: z.string().optional(),
  endOfSutureTime: z.string().optional(),
  readyTime: z.string().optional(),
  notes: z.string().optional(),
});

async function getClinicDayDate(clinicId: string): Promise<Date> {
  const clinic = await prisma.clinicVisit.findUniqueOrThrow({
    where: { id: clinicId },
    include: { surgicalDay: true },
  });
  return clinic.surgicalDay.date;
}

async function getNextOrder(clinicId: string): Promise<number> {
  const result = await prisma.surgeryCase.aggregate({
    where: { clinicVisitId: clinicId },
    _max: { order: true },
  });
  return (result._max.order ?? -1) + 1;
}

/**
 * After a surgery is saved, if it has a readyTime and is the last surgery
 * at the clinic, sync the clinic's readyToLeaveTime.
 */
async function syncClinicReadyToLeave(clinicId: string) {
  const cases = await prisma.surgeryCase.findMany({
    where: { clinicVisitId: clinicId },
    orderBy: { order: "asc" },
  });

  const lastCase = cases[cases.length - 1];
  await prisma.clinicVisit.update({
    where: { id: clinicId },
    data: { readyToLeaveTime: lastCase?.readyTime ?? null },
  });
}

export async function createSurgeryCase(clinicId: string, dayId: string, formData: FormData) {
  const raw = {
    surgeonId: formData.get("surgeonId") as string,
    patientName: formData.get("patientName") as string,
    patientWeight: formData.get("patientWeight") as string || undefined,
    numTechnicians: formData.get("numTechnicians") as string || "1",
    surgeryCategory: formData.get("surgeryCategory") as string,
    surgeryType: formData.get("surgeryType") as string,
    incisionStartTime: formData.get("incisionStartTime") as string || undefined,
    endOfSutureTime: formData.get("endOfSutureTime") as string || undefined,
    readyTime: formData.get("readyTime") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const parsed = SurgeryCaseSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [dayDate, order] = await Promise.all([getClinicDayDate(clinicId), getNextOrder(clinicId)]);

  await prisma.surgeryCase.create({
    data: {
      clinicVisitId: clinicId,
      surgeonId: parsed.data.surgeonId,
      patientName: parsed.data.patientName,
      patientWeight: parsed.data.patientWeight ? parseFloat(parsed.data.patientWeight) : null,
      numTechnicians: parseInt(parsed.data.numTechnicians) || 1,
      surgeryCategory: parsed.data.surgeryCategory,
      surgeryType: parsed.data.surgeryType,
      incisionStartTime: parseTime(dayDate, parsed.data.incisionStartTime),
      endOfSutureTime: parseTime(dayDate, parsed.data.endOfSutureTime),
      readyTime: parseTime(dayDate, parsed.data.readyTime),
      notes: parsed.data.notes || null,
      order,
    },
  });

  await syncClinicReadyToLeave(clinicId);

  revalidatePath(`/days/${dayId}`);
}

export async function updateSurgeryCase(
  id: string,
  clinicId: string,
  dayId: string,
  formData: FormData
) {
  const raw = {
    surgeonId: formData.get("surgeonId") as string,
    patientName: formData.get("patientName") as string,
    patientWeight: formData.get("patientWeight") as string || undefined,
    numTechnicians: formData.get("numTechnicians") as string || "1",
    surgeryCategory: formData.get("surgeryCategory") as string,
    surgeryType: formData.get("surgeryType") as string,
    incisionStartTime: formData.get("incisionStartTime") as string || undefined,
    endOfSutureTime: formData.get("endOfSutureTime") as string || undefined,
    readyTime: formData.get("readyTime") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const parsed = SurgeryCaseSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const dayDate = await getClinicDayDate(clinicId);

  await prisma.surgeryCase.update({
    where: { id },
    data: {
      surgeonId: parsed.data.surgeonId,
      patientName: parsed.data.patientName,
      patientWeight: parsed.data.patientWeight ? parseFloat(parsed.data.patientWeight) : null,
      numTechnicians: parseInt(parsed.data.numTechnicians) || 1,
      surgeryCategory: parsed.data.surgeryCategory,
      surgeryType: parsed.data.surgeryType,
      incisionStartTime: parseTime(dayDate, parsed.data.incisionStartTime),
      endOfSutureTime: parseTime(dayDate, parsed.data.endOfSutureTime),
      readyTime: parseTime(dayDate, parsed.data.readyTime),
      notes: parsed.data.notes || null,
    },
  });

  await syncClinicReadyToLeave(clinicId);

  revalidatePath(`/days/${dayId}`);
}

export async function deleteSurgeryCase(id: string, clinicId: string, dayId: string) {
  await prisma.surgeryCase.delete({ where: { id } });
  await syncClinicReadyToLeave(clinicId);
  revalidatePath(`/days/${dayId}`);
  redirect(`/days/${dayId}`);
}

export async function getSurgeryCase(id: string) {
  return prisma.surgeryCase.findUnique({
    where: { id },
    include: {
      surgeon: true,
      clinicVisit: {
        include: { surgicalDay: true },
      },
    },
  });
}
