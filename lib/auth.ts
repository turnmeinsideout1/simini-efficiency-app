import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  role: "SURGEON" | "STAFF";
  practiceId: string;
  surgeonId: string | null;
  practice: { id: string; name: string };
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { practice: true },
  });

  if (!dbUser) return null;

  return {
    id: dbUser.id,
    supabaseId: dbUser.supabaseId,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    practiceId: dbUser.practiceId,
    surgeonId: dbUser.surgeonId,
    practice: { id: dbUser.practice.id, name: dbUser.practice.name },
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
