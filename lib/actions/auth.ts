"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SURGEON", "STAFF"]),
  practiceAction: z.enum(["create", "join"]),
  practiceName: z.string().min(2, "Practice name required"),
  practicePassword: z.string().min(4, "Practice password required"),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthResult = { error: string } | { success: true; redirectTo?: string };

export async function registerUser(formData: FormData): Promise<AuthResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    practiceAction: formData.get("practiceAction"),
    practiceName: formData.get("practiceName"),
    practicePassword: formData.get("practicePassword"),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { name, email, password, role, practiceAction, practiceName, practicePassword } = parsed.data;

  // ── Find or create practice ──────────────────────────────────────────────
  let practice = await prisma.practice.findUnique({ where: { name: practiceName } });

  if (practiceAction === "create") {
    if (practice) return { error: "A practice with that name already exists. Choose 'Join' instead." };
    practice = await prisma.practice.create({
      data: {
        name: practiceName,
        passwordHash: await bcrypt.hash(practicePassword, 10),
      },
    });
  } else {
    // join
    if (!practice) return { error: "No practice found with that name." };
    const passwordMatch = await bcrypt.compare(practicePassword, practice.passwordHash);
    if (!passwordMatch) return { error: "Incorrect practice password." };
  }

  // ── Create Supabase auth user ────────────────────────────────────────────
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError || !authData.user) {
    return { error: authError?.message ?? "Failed to create account." };
  }

  // ── Create Surgeon record if role=SURGEON ────────────────────────────────
  let surgeonId: string | null = null;
  if (role === "SURGEON") {
    const existing = await prisma.surgeon.findFirst({
      where: { name, practiceId: practice.id },
    });
    const surgeon = existing
      ? existing
      : await prisma.surgeon.create({
          data: { name, practiceId: practice.id },
        });
    surgeonId = surgeon.id;
  }

  // ── Create User record ───────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      supabaseId: authData.user.id,
      email,
      name,
      role,
      practiceId: practice.id,
      surgeonId,
    },
  });

  // ── Sign in immediately so the user lands logged in ──────────────────────
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Email confirmation is enabled in Supabase — account was created, just needs confirmation
    return { error: "Account created! Check your email to confirm it, then sign in." };
  }

  // New practices start on the surgeons onboarding page; joining an existing practice goes home
  const redirectTo = practiceAction === "create" ? "/settings/surgeons?onboarding=1" : "/";
  return { success: true, redirectTo };
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid email or password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please confirm your email before signing in." };
    }
    return { error: "Incorrect email or password." };
  }

  return { success: true };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getPractices() {
  return prisma.practice.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export async function updateProfile(formData: FormData): Promise<AuthResult> {
  const user = await requireUser();
  const parsed = UpdateProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  // Does NOT update Surgeon.name — managed separately via /settings/surgeons
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  await requireUser();
  const parsed = UpdatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: true };
}
