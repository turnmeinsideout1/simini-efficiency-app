"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { combineDateAndTime } from "@/lib/utils";

const DaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  primarySurgeonId: z.string().min(1, "Surgeon is required"),
  hqDepartureTime: z.string().optional(),
  hqReturnArrivalTime: z.string().optional(),
  notes: z.string().optional(),
});

/** Parse a "yyyy-MM-dd" string into a UTC-noon Date so it never shifts day across timezones. */
function parseDateOnly(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00.000Z");
}

function parseTimeForDay(dateStr: string, timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  // Build a local-midnight base from the date string, then apply the time
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayDate = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return combineDateAndTime(dayDate, timeStr);
}

const INCLUDE_FULL = {
  primarySurgeon: true,
  clinicVisits: {
    include: {
      surgeryCases: {
        include: { surgeon: true },
        orderBy: { order: "asc" as const },
      },
    },
    orderBy: { order: "asc" as const },
  },
} as const;

export async function createDay(formData: FormData) {
  const user = await requireUser();
  const raw = {
    date: formData.get("date") as string,
    primarySurgeonId: formData.get("primarySurgeonId") as string,
    hqDepartureTime: (formData.get("hqDepartureTime") as string) || undefined,
    hqReturnArrivalTime: (formData.get("hqReturnArrivalTime") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };
  const parsed = DaySchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const day = await prisma.surgicalDay.create({
    data: {
      date: parseDateOnly(parsed.data.date),
      practiceId: user.practiceId,
      primarySurgeonId: parsed.data.primarySurgeonId,
      hqDepartureTime: parseTimeForDay(parsed.data.date, parsed.data.hqDepartureTime),
      hqReturnArrivalTime: parseTimeForDay(parsed.data.date, parsed.data.hqReturnArrivalTime),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/");
  redirect(`/days/${day.id}`);
}

export async function updateDay(id: string, formData: FormData) {
  const user = await requireUser();
  const raw = {
    date: formData.get("date") as string,
    primarySurgeonId: formData.get("primarySurgeonId") as string,
    hqDepartureTime: (formData.get("hqDepartureTime") as string) || undefined,
    hqReturnArrivalTime: (formData.get("hqReturnArrivalTime") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };
  const parsed = DaySchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.surgicalDay.update({
    where: { id, practiceId: user.practiceId },
    data: {
      date: parseDateOnly(parsed.data.date),
      primarySurgeonId: parsed.data.primarySurgeonId,
      hqDepartureTime: parseTimeForDay(parsed.data.date, parsed.data.hqDepartureTime),
      hqReturnArrivalTime: parseTimeForDay(parsed.data.date, parsed.data.hqReturnArrivalTime),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/days/${id}`);
  revalidatePath("/");
  redirect(`/days/${id}`);
}

export async function deleteDay(id: string) {
  const user = await requireUser();
  await prisma.surgicalDay.delete({ where: { id, practiceId: user.practiceId } });
  revalidatePath("/");
  redirect("/");
}

export async function getDays() {
  const user = await requireUser();
  return prisma.surgicalDay.findMany({
    where: { practiceId: user.practiceId },
    include: INCLUDE_FULL,
    orderBy: { date: "desc" },
  });
}

export async function getDaysForMonth(yearMonth: string) {
  const user = await requireUser();
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.surgicalDay.findMany({
    where: { practiceId: user.practiceId, date: { gte: start, lte: end } },
    include: INCLUDE_FULL,
    orderBy: { date: "asc" },
  });
}

export async function getDaysForDate(dateStr: string) {
  const user = await requireUser();
  // Fetch the whole month then filter using the same format() logic the calendar
  // uses to build its dayMap — guarantees both sides agree on which date a record
  // belongs to regardless of how the stored UTC timestamp was originally set.
  const [year, month] = dateStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const monthDays = await prisma.surgicalDay.findMany({
    where: { practiceId: user.practiceId, date: { gte: start, lte: end } },
    include: INCLUDE_FULL,
    orderBy: { createdAt: "asc" },
  });

  return monthDays.filter(day => (day.date as Date).toISOString().slice(0, 10) === dateStr);
}

export async function getDay(id: string) {
  const user = await requireUser();
  return prisma.surgicalDay.findFirst({
    where: { id, practiceId: user.practiceId },
    include: INCLUDE_FULL,
  });
}
