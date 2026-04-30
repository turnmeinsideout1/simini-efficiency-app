"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const ClinicNameSchema = z.object({
  name: z.string().min(1).max(200).transform((s) => s.trim()),
});

export async function getReferringClinics() {
  const user = await requireUser();
  return prisma.referringClinic.findMany({
    where: { practiceId: user.practiceId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createReferringClinic(formData: FormData) {
  const user = await requireUser();
  const parsed = ClinicNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.referringClinic.upsert({
    where: { name_practiceId: { name: parsed.data.name, practiceId: user.practiceId } },
    create: { name: parsed.data.name, practiceId: user.practiceId },
    update: { isActive: true },
  });
  revalidatePath("/settings/clinics");
}

export async function updateReferringClinic(id: string, formData: FormData) {
  const user = await requireUser();
  const parsed = ClinicNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.referringClinic.update({
    where: { id, practiceId: user.practiceId },
    data: { name: parsed.data.name },
  });
  revalidatePath("/settings/clinics");
}

export async function deleteReferringClinic(id: string) {
  const user = await requireUser();
  await prisma.referringClinic.update({
    where: { id, practiceId: user.practiceId },
    data: { isActive: false },
  });
  revalidatePath("/settings/clinics");
}

/** Bulk create from CSV text — one clinic name per line */
export async function importClinicsFromCsv(csvText: string) {
  const user = await requireUser();

  const names = csvText
    .split("\n")
    .map((line) => line.replace(/[",]/g, "").trim())
    .filter((name) => name.length > 0 && name.toLowerCase() !== "name");

  if (names.length === 0) throw new Error("No valid clinic names found in file.");
  if (names.length > 500) throw new Error("Maximum 500 clinics per import.");

  let created = 0;
  for (const name of names) {
    await prisma.referringClinic.upsert({
      where: { name_practiceId: { name, practiceId: user.practiceId } },
      create: { name, practiceId: user.practiceId },
      update: { isActive: true },
    });
    created++;
  }

  revalidatePath("/settings/clinics");
  return { count: created };
}
