"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const SurgeonSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().optional(),
});

export async function createSurgeon(formData: FormData) {
  const user = await requireUser();
  const parsed = SurgeonSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.surgeon.create({
    data: { name: parsed.data.name, color: parsed.data.color ?? "blue", practiceId: user.practiceId },
  });
  revalidatePath("/settings/surgeons");
  const onboarding = formData.get("onboarding") === "1";
  redirect(onboarding ? "/settings/surgeons?onboarding=1" : "/settings/surgeons");
}

export async function updateSurgeon(id: string, formData: FormData) {
  const user = await requireUser();
  const parsed = SurgeonSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.surgeon.update({
    where: { id, practiceId: user.practiceId },
    data: { name: parsed.data.name, color: parsed.data.color ?? null },
  });
  revalidatePath("/settings/surgeons");
  redirect("/settings/surgeons");
}

export async function deleteSurgeon(id: string) {
  const user = await requireUser();
  await prisma.surgeon.update({ where: { id, practiceId: user.practiceId }, data: { isActive: false } });
  revalidatePath("/settings/surgeons");
}

export async function getSurgeons() {
  const user = await requireUser();
  return prisma.surgeon.findMany({
    where: { practiceId: user.practiceId, isActive: true },
    orderBy: { name: "asc" },
  });
}
