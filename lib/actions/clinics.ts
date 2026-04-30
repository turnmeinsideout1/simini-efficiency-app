"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseTime } from "@/lib/utils";

const ClinicSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required").max(200),
  arrivalTime: z.string().optional(),
  readyToLeaveTime: z.string().optional(),
});

async function getDayDate(dayId: string): Promise<Date> {
  const day = await prisma.surgicalDay.findUniqueOrThrow({ where: { id: dayId } });
  return day.date;
}

async function getNextOrder(dayId: string): Promise<number> {
  const result = await prisma.clinicVisit.aggregate({
    where: { surgicalDayId: dayId },
    _max: { order: true },
  });
  return (result._max.order ?? -1) + 1;
}

export async function createClinicVisit(dayId: string, formData: FormData) {
  const raw = {
    clinicName: formData.get("clinicName") as string,
    arrivalTime: formData.get("arrivalTime") as string || undefined,
    readyToLeaveTime: formData.get("readyToLeaveTime") as string || undefined,
  };

  const parsed = ClinicSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const [dayDate, order] = await Promise.all([getDayDate(dayId), getNextOrder(dayId)]);

  await prisma.clinicVisit.create({
    data: {
      surgicalDayId: dayId,
      clinicName: parsed.data.clinicName,
      arrivalTime: parseTime(dayDate, parsed.data.arrivalTime),
      readyToLeaveTime: parseTime(dayDate, parsed.data.readyToLeaveTime),
      order,
    },
  });

  revalidatePath(`/days/${dayId}`);
}

export async function updateClinicVisit(
  id: string,
  dayId: string,
  formData: FormData
) {
  const raw = {
    clinicName: formData.get("clinicName") as string,
    arrivalTime: formData.get("arrivalTime") as string || undefined,
    readyToLeaveTime: formData.get("readyToLeaveTime") as string || undefined,
  };

  const parsed = ClinicSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const dayDate = await getDayDate(dayId);

  await prisma.clinicVisit.update({
    where: { id },
    data: {
      clinicName: parsed.data.clinicName,
      arrivalTime: parseTime(dayDate, parsed.data.arrivalTime),
      readyToLeaveTime: parseTime(dayDate, parsed.data.readyToLeaveTime),
    },
  });

  revalidatePath(`/days/${dayId}`);
}

export async function deleteClinicVisit(id: string, dayId: string) {
  await prisma.clinicVisit.delete({ where: { id } });
  revalidatePath(`/days/${dayId}`);
  redirect(`/days/${dayId}`);
}

export async function getClinicVisit(id: string) {
  return prisma.clinicVisit.findUnique({
    where: { id },
    include: {
      surgeryCases: {
        include: { surgeon: true },
        orderBy: { order: "asc" },
      },
      surgicalDay: true,
    },
  });
}
