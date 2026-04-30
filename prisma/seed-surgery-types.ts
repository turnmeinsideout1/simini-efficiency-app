import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  for (const name of ortho) {
    // TPLO gets sortOrder 0 (first), everything else gets 1 (then sorted alphabetically by name)
    const sortOrder = name === "TPLO" ? 0 : 1;
    await prisma.surgeryType.upsert({
      where: { name_category: { name, category: "ORTHOPEDIC" } },
      create: { name, category: "ORTHOPEDIC", sortOrder },
      update: { sortOrder, isActive: true },
    });
  }
  for (const name of soft) {
    // All soft tissue gets sortOrder 0 — alphabetical by name
    await prisma.surgeryType.upsert({
      where: { name_category: { name, category: "SOFT_TISSUE" } },
      create: { name, category: "SOFT_TISSUE", sortOrder: 0 },
      update: { sortOrder: 0, isActive: true },
    });
  }

  console.log(`✓ Seeded ${ortho.length} orthopedic + ${soft.length} soft tissue surgery types`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
