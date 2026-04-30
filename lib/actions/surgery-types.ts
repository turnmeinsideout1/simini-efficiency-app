"use server";

import { prisma } from "@/lib/prisma";
import type { SurgeryCategory } from "@prisma/client";

export async function getSurgeryTypes(category?: SurgeryCategory) {
  return prisma.surgeryType.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function seedSurgeryTypes() {
  const ortho = [
    "TPLO", "FHO", "Lateral Suture", "Arthroscopy", "Implant Removal",
    "MPL/CCL", "Fracture (femur)", "Fracture (RU)", "Fracture (Humerus)",
    "Fracture (Tibia)", "Fracture (Other)", "Growth plate Fracture (Other)",
    "Tibial Tuberosity", "Condylar Fracture", "Amputation", "MPL Only",
    "Other (Ortho)",
  ];
  const soft = [
    "TECA", "BOAS", "Anal Sacculectomy", "Tumor Removal", "Salivary Mucocele",
    "PU", "Splenectomy", "Lar Par", "Foreign Body", "Hernia", "Spay",
    "Gastropexy", "Spay Gastropexy", "Other (Soft Tissue)",
  ];

  for (let i = 0; i < ortho.length; i++) {
    await prisma.surgeryType.upsert({
      where: { name_category: { name: ortho[i], category: "ORTHOPEDIC" } },
      create: { name: ortho[i], category: "ORTHOPEDIC", sortOrder: i },
      update: { sortOrder: i, isActive: true },
    });
  }
  for (let i = 0; i < soft.length; i++) {
    await prisma.surgeryType.upsert({
      where: { name_category: { name: soft[i], category: "SOFT_TISSUE" } },
      create: { name: soft[i], category: "SOFT_TISSUE", sortOrder: i },
      update: { sortOrder: i, isActive: true },
    });
  }
}
