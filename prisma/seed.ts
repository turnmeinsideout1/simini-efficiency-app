import { PrismaClient, SurgeryCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Return a Date N days before today at midnight */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Combine a base date with a "HH:MM" time string */
function dt(base: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

async function seedSurgeryTypes() {
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

  console.log(`Surgery types seeded: ${ortho.length} ortho + ${soft.length} soft tissue`);
}

async function main() {
  console.log("Seeding database — clearing old data first…");

  // Clear in dependency order (users first to unlink surgeonId FK)
  await prisma.surgeryCase.deleteMany();
  await prisma.clinicVisit.deleteMany();
  await prisma.surgicalDay.deleteMany();
  await prisma.user.deleteMany();
  await prisma.surgeon.deleteMany();
  await prisma.referringClinic.deleteMany();
  await prisma.practice.deleteMany();

  // ─── Surgery Types (global) ───────────────────────────────────────────────
  await seedSurgeryTypes();

  // ─── Demo Practice ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo123", 10);
  const practice = await prisma.practice.create({
    data: {
      id: "practice-demo",
      name: "Jewel Vet Surgery",
      passwordHash,
    },
  });
  console.log(`Practice created: ${practice.name} (password: demo123)`);

  // ─── Referring Clinics ────────────────────────────────────────────────────
  const clinicNames = [
    "Riverside Animal Hospital",
    "Valley Veterinary Center",
    "Northside Emergency Vet",
    "Lakewood Animal Clinic",
    "Hilltop Pet Hospital",
  ];
  for (const name of clinicNames) {
    await prisma.referringClinic.create({ data: { name, practiceId: practice.id } });
  }
  console.log(`Referring clinics created: ${clinicNames.length}`);

  // ─── Surgeons ─────────────────────────────────────────────────────────────
  const [patel, chen, morgan] = await Promise.all([
    prisma.surgeon.create({ data: { id: "s1", name: "Dr. Aisha Patel", color: "blue", practiceId: practice.id } }),
    prisma.surgeon.create({ data: { id: "s2", name: "Dr. James Chen", color: "green", practiceId: practice.id } }),
    prisma.surgeon.create({ data: { id: "s3", name: "Dr. Sarah Morgan", color: "purple", practiceId: practice.id } }),
  ]);
  console.log("Surgeons created.");

  // ─── Helper to build a full surgical day ─────────────────────────────────
  type CaseInput = {
    surgeonId: string;
    patientName: string;
    weight: number;
    techs: number;
    category: SurgeryCategory;
    type: string;
    incision: string;
    suture: string;
    ready: string;
    notes?: string;
  };

  type ClinicInput = {
    name: string;
    arrive: string;
    cases: CaseInput[];
  };

  async function makeDay(opts: {
    id: string;
    daysAgoN: number;
    surgeonId: string;
    depart: string;
    returnArrival?: string;
    notes?: string;
    clinics: ClinicInput[];
  }) {
    const base = daysAgo(opts.daysAgoN);

    const day = await prisma.surgicalDay.create({
      data: {
        id: opts.id,
        date: base,
        practiceId: practice.id,
        primarySurgeonId: opts.surgeonId,
        hqDepartureTime: dt(base, opts.depart),
        hqReturnArrivalTime: opts.returnArrival ? dt(base, opts.returnArrival) : null,
        notes: opts.notes ?? null,
      },
    });

    for (let ci = 0; ci < opts.clinics.length; ci++) {
      const c = opts.clinics[ci];

      // Last case's ready time becomes the clinic's readyToLeaveTime
      const lastCase = c.cases[c.cases.length - 1];
      const readyToLeave = lastCase ? dt(base, lastCase.ready) : null;

      const clinic = await prisma.clinicVisit.create({
        data: {
          surgicalDayId: day.id,
          clinicName: c.name,
          arrivalTime: dt(base, c.arrive),
          readyToLeaveTime: readyToLeave,
          order: ci,
        },
      });

      for (let ki = 0; ki < c.cases.length; ki++) {
        const k = c.cases[ki];
        await prisma.surgeryCase.create({
          data: {
            clinicVisitId: clinic.id,
            surgeonId: k.surgeonId,
            patientName: k.patientName,
            patientWeight: k.weight,
            numTechnicians: k.techs,
            surgeryCategory: k.category,
            surgeryType: k.type,
            incisionStartTime: dt(base, k.incision),
            endOfSutureTime: dt(base, k.suture),
            readyTime: dt(base, k.ready),
            notes: k.notes ?? null,
            order: ki,
          },
        });
      }
    }

    return day;
  }

  // ─── Surgical Days ────────────────────────────────────────────────────────

  // TODAY (day 0) — in progress, no return time yet
  await makeDay({
    id: "d01", daysAgoN: 0, surgeonId: morgan.id,
    depart: "07:45",
    notes: "Today's day — in progress.",
    clinics: [{
      name: "Hilltop Pet Hospital", arrive: "08:30",
      cases: [
        { surgeonId: morgan.id, patientName: "Luna", weight: 22.0, techs: 2, category: "ORTHOPEDIC", type: "FHO", incision: "09:00", suture: "10:05", ready: "10:30" },
        { surgeonId: morgan.id, patientName: "Archie", weight: 18.5, techs: 1, category: "SOFT_TISSUE", type: "Gastropexy", incision: "11:00", suture: "11:45", ready: "12:10" },
      ],
    }],
  });

  // Yesterday
  await makeDay({
    id: "d02", daysAgoN: 1, surgeonId: patel.id,
    depart: "07:15", returnArrival: "17:20",
    clinics: [
      {
        name: "Riverside Animal Hospital", arrive: "08:05",
        cases: [
          { surgeonId: patel.id, patientName: "Biscuit", weight: 32.5, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "08:40", suture: "10:15", ready: "10:45", notes: "Smooth approach, good bone quality." },
          { surgeonId: patel.id, patientName: "Pepper", weight: 8.2, techs: 1, category: "SOFT_TISSUE", type: "Foreign Body", incision: "11:10", suture: "11:50", ready: "12:00", notes: "Sock — full thickness. Good margins." },
        ],
      },
      {
        name: "Valley Veterinary Center", arrive: "12:55",
        cases: [
          { surgeonId: chen.id, patientName: "Ranger", weight: 41.0, techs: 2, category: "SOFT_TISSUE", type: "Splenectomy", incision: "13:30", suture: "15:10", ready: "15:45", notes: "Large splenic mass. Histopath submitted." },
        ],
      },
    ],
  });

  // 2 days ago
  await makeDay({
    id: "d03", daysAgoN: 2, surgeonId: chen.id,
    depart: "07:30", returnArrival: "15:50",
    clinics: [{
      name: "Northside Emergency Vet", arrive: "08:20",
      cases: [
        { surgeonId: chen.id, patientName: "Rosie", weight: 14.0, techs: 2, category: "ORTHOPEDIC", type: "MPL/CCL", incision: "09:00", suture: "10:30", ready: "11:00" },
        { surgeonId: chen.id, patientName: "Bear", weight: 36.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "11:30", suture: "13:05", ready: "13:35" },
        { surgeonId: chen.id, patientName: "Nala", weight: 11.0, techs: 1, category: "SOFT_TISSUE", type: "Tumor Removal", incision: "14:05", suture: "14:40", ready: "15:00" },
      ],
    }],
  });

  // 4 days ago
  await makeDay({
    id: "d04", daysAgoN: 4, surgeonId: morgan.id,
    depart: "07:50", returnArrival: "16:30",
    clinics: [
      {
        name: "Lakewood Animal Clinic", arrive: "08:40",
        cases: [
          { surgeonId: morgan.id, patientName: "Oscar", weight: 28.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "09:10", suture: "10:45", ready: "11:15" },
        ],
      },
      {
        name: "Valley Veterinary Center", arrive: "12:10",
        cases: [
          { surgeonId: morgan.id, patientName: "Bella", weight: 6.5, techs: 1, category: "SOFT_TISSUE", type: "PU", incision: "12:50", suture: "13:40", ready: "14:05" },
          { surgeonId: morgan.id, patientName: "Milo", weight: 9.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "14:35", suture: "15:10", ready: "15:30" },
        ],
      },
    ],
  });

  // 5 days ago — two surgeons operating same day
  await makeDay({
    id: "d05", daysAgoN: 5, surgeonId: patel.id,
    depart: "07:00", returnArrival: "14:45",
    clinics: [{
      name: "Riverside Animal Hospital", arrive: "07:55",
      cases: [
        { surgeonId: patel.id, patientName: "Cleo", weight: 24.0, techs: 2, category: "ORTHOPEDIC", type: "Fracture (femur)", incision: "08:30", suture: "10:10", ready: "10:40", notes: "Comminuted mid-diaphyseal fracture. Good reduction." },
        { surgeonId: patel.id, patientName: "Moose", weight: 44.0, techs: 2, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "11:15", suture: "13:00", ready: "13:30" },
      ],
    }],
  });

  await makeDay({
    id: "d06", daysAgoN: 5, surgeonId: chen.id,
    depart: "08:00", returnArrival: "16:00",
    clinics: [{
      name: "Hilltop Pet Hospital", arrive: "08:55",
      cases: [
        { surgeonId: chen.id, patientName: "Toby", weight: 30.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "09:30", suture: "11:10", ready: "11:40" },
        { surgeonId: chen.id, patientName: "Daisy", weight: 7.5, techs: 1, category: "SOFT_TISSUE", type: "Spay", incision: "12:15", suture: "13:00", ready: "13:20" },
        { surgeonId: chen.id, patientName: "Rex", weight: 38.0, techs: 2, category: "SOFT_TISSUE", type: "Splenectomy", incision: "13:50", suture: "15:20", ready: "15:45" },
      ],
    }],
  });

  // 7 days ago
  await makeDay({
    id: "d07", daysAgoN: 7, surgeonId: morgan.id,
    depart: "07:30", returnArrival: "15:00",
    clinics: [{
      name: "Northside Emergency Vet", arrive: "08:25",
      cases: [
        { surgeonId: morgan.id, patientName: "Zeus", weight: 40.0, techs: 2, category: "ORTHOPEDIC", type: "Other (Ortho)", incision: "09:00", suture: "11:00", ready: "11:30", notes: "Complex biapical deformity. Pre-planned with CT." },
        { surgeonId: morgan.id, patientName: "Lulu", weight: 5.2, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "12:05", suture: "13:10", ready: "13:35" },
      ],
    }],
  });

  // 9 days ago
  await makeDay({
    id: "d08", daysAgoN: 9, surgeonId: patel.id,
    depart: "07:10", returnArrival: "17:05",
    clinics: [
      {
        name: "Lakewood Animal Clinic", arrive: "08:00",
        cases: [
          { surgeonId: patel.id, patientName: "Buddy", weight: 29.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "08:35", suture: "10:10", ready: "10:40" },
          { surgeonId: patel.id, patientName: "Ginger", weight: 12.0, techs: 1, category: "SOFT_TISSUE", type: "Tumor Removal", incision: "11:10", suture: "11:50", ready: "12:10" },
        ],
      },
      {
        name: "Riverside Animal Hospital", arrive: "13:00",
        cases: [
          { surgeonId: patel.id, patientName: "Atlas", weight: 45.0, techs: 2, category: "ORTHOPEDIC", type: "Fracture (RU)", incision: "13:40", suture: "15:20", ready: "15:55" },
          { surgeonId: chen.id, patientName: "Hazel", weight: 9.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "16:10", suture: "16:45", ready: "17:00", notes: "Dr. Chen assisted — referred case." },
        ],
      },
    ],
  });

  // 11 days ago
  await makeDay({
    id: "d09", daysAgoN: 11, surgeonId: chen.id,
    depart: "07:45", returnArrival: "15:30",
    clinics: [{
      name: "Valley Veterinary Center", arrive: "08:40",
      cases: [
        { surgeonId: chen.id, patientName: "Murphy", weight: 33.0, techs: 2, category: "ORTHOPEDIC", type: "FHO", incision: "09:15", suture: "10:20", ready: "10:50" },
        { surgeonId: chen.id, patientName: "Poppy", weight: 19.0, techs: 2, category: "ORTHOPEDIC", type: "MPL/CCL", incision: "11:20", suture: "12:30", ready: "12:55" },
        { surgeonId: chen.id, patientName: "Samson", weight: 50.0, techs: 2, category: "SOFT_TISSUE", type: "Hernia", incision: "13:30", suture: "14:50", ready: "15:10", notes: "Traumatic hernia — guarded prognosis." },
      ],
    }],
  });

  // 12 days ago
  await makeDay({
    id: "d10", daysAgoN: 12, surgeonId: morgan.id,
    depart: "07:20", returnArrival: "13:45",
    clinics: [{
      name: "Hilltop Pet Hospital", arrive: "08:10",
      cases: [
        { surgeonId: morgan.id, patientName: "Coco", weight: 16.0, techs: 1, category: "SOFT_TISSUE", type: "Spay", incision: "08:50", suture: "09:35", ready: "09:55" },
        { surgeonId: morgan.id, patientName: "Duke", weight: 37.0, techs: 2, category: "SOFT_TISSUE", type: "Gastropexy", incision: "10:25", suture: "12:15", ready: "12:50", notes: "Emergency GDV. Gastropexy performed." },
      ],
    }],
  });

  // 14 days ago — three surgeons operating same day
  await makeDay({
    id: "d11", daysAgoN: 14, surgeonId: patel.id,
    depart: "07:00", returnArrival: "16:10",
    clinics: [{
      name: "Northside Emergency Vet", arrive: "07:55",
      cases: [
        { surgeonId: patel.id, patientName: "Shadow", weight: 31.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "08:30", suture: "10:05", ready: "10:35" },
        { surgeonId: patel.id, patientName: "Penny", weight: 13.0, techs: 1, category: "SOFT_TISSUE", type: "Foreign Body", incision: "11:10", suture: "12:30", ready: "12:55" },
        { surgeonId: patel.id, patientName: "Tucker", weight: 42.0, techs: 2, category: "SOFT_TISSUE", type: "Splenectomy", incision: "13:30", suture: "14:55", ready: "15:20" },
      ],
    }],
  });

  await makeDay({
    id: "d12", daysAgoN: 14, surgeonId: chen.id,
    depart: "08:00", returnArrival: "14:20",
    clinics: [{
      name: "Riverside Animal Hospital", arrive: "08:55",
      cases: [
        { surgeonId: chen.id, patientName: "Zara", weight: 20.0, techs: 2, category: "ORTHOPEDIC", type: "FHO", incision: "09:30", suture: "11:30", ready: "12:00", notes: "Bilateral FHO, simultaneous." },
        { surgeonId: chen.id, patientName: "Finn", weight: 27.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "12:45", suture: "13:50", ready: "14:05" },
      ],
    }],
  });

  await makeDay({
    id: "d13", daysAgoN: 14, surgeonId: morgan.id,
    depart: "07:30", returnArrival: "12:30",
    clinics: [{
      name: "Lakewood Animal Clinic", arrive: "08:20",
      cases: [
        { surgeonId: morgan.id, patientName: "Willow", weight: 10.5, techs: 1, category: "SOFT_TISSUE", type: "PU", incision: "09:00", suture: "09:55", ready: "10:15" },
        { surgeonId: morgan.id, patientName: "Bruno", weight: 26.0, techs: 2, category: "ORTHOPEDIC", type: "MPL/CCL", incision: "10:45", suture: "11:50", ready: "12:10" },
      ],
    }],
  });

  // 16 days ago
  await makeDay({
    id: "d14", daysAgoN: 16, surgeonId: patel.id,
    depart: "07:15", returnArrival: "16:45",
    clinics: [
      {
        name: "Valley Veterinary Center", arrive: "08:10",
        cases: [
          { surgeonId: patel.id, patientName: "Remy", weight: 4.8, techs: 1, category: "SOFT_TISSUE", type: "Spay", incision: "08:50", suture: "09:30", ready: "09:50" },
          { surgeonId: patel.id, patientName: "Koda", weight: 35.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "10:20", suture: "11:55", ready: "12:25" },
        ],
      },
      {
        name: "Hilltop Pet Hospital", arrive: "13:20",
        cases: [
          { surgeonId: patel.id, patientName: "Maggie", weight: 22.5, techs: 2, category: "ORTHOPEDIC", type: "Fracture (Tibia)", incision: "14:00", suture: "15:30", ready: "16:00" },
        ],
      },
    ],
  });

  // 18 days ago
  await makeDay({
    id: "d15", daysAgoN: 18, surgeonId: morgan.id,
    depart: "07:40", returnArrival: "15:20",
    clinics: [{
      name: "Northside Emergency Vet", arrive: "08:35",
      cases: [
        { surgeonId: morgan.id, patientName: "Jack", weight: 17.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "09:05", suture: "10:40", ready: "11:10" },
        { surgeonId: morgan.id, patientName: "Stella", weight: 23.0, techs: 2, category: "ORTHOPEDIC", type: "Other (Ortho)", incision: "11:45", suture: "13:15", ready: "13:45" },
        { surgeonId: morgan.id, patientName: "Ivy", weight: 8.0, techs: 1, category: "SOFT_TISSUE", type: "Tumor Removal", incision: "14:15", suture: "14:45", ready: "15:00" },
      ],
    }],
  });

  // 19 days ago
  await makeDay({
    id: "d16", daysAgoN: 19, surgeonId: chen.id,
    depart: "07:25", returnArrival: "16:55",
    clinics: [
      {
        name: "Lakewood Animal Clinic", arrive: "08:20",
        cases: [
          { surgeonId: chen.id, patientName: "Simba", weight: 48.0, techs: 2, category: "SOFT_TISSUE", type: "Gastropexy", incision: "09:00", suture: "10:45", ready: "11:20", notes: "Presented collapsed. Good recovery." },
        ],
      },
      {
        name: "Riverside Animal Hospital", arrive: "12:15",
        cases: [
          { surgeonId: chen.id, patientName: "Nora", weight: 15.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "13:00", suture: "13:45", ready: "14:05" },
          { surgeonId: chen.id, patientName: "Max", weight: 39.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "14:35", suture: "16:15", ready: "16:45" },
        ],
      },
    ],
  });

  // 21 days ago
  await makeDay({
    id: "d17", daysAgoN: 21, surgeonId: patel.id,
    depart: "07:00", returnArrival: "14:00",
    clinics: [{
      name: "Hilltop Pet Hospital", arrive: "07:55",
      cases: [
        { surgeonId: patel.id, patientName: "Charlie", weight: 11.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "08:30", suture: "09:45", ready: "10:10" },
        { surgeonId: patel.id, patientName: "Loki", weight: 34.0, techs: 2, category: "ORTHOPEDIC", type: "FHO", incision: "10:45", suture: "11:55", ready: "12:20" },
        { surgeonId: patel.id, patientName: "Ruby", weight: 7.0, techs: 1, category: "SOFT_TISSUE", type: "PU", incision: "12:50", suture: "13:35", ready: "13:50" },
      ],
    }],
  });

  // 23 days ago
  await makeDay({
    id: "d18", daysAgoN: 23, surgeonId: morgan.id,
    depart: "07:35", returnArrival: "15:10",
    clinics: [{
      name: "Valley Veterinary Center", arrive: "08:30",
      cases: [
        { surgeonId: morgan.id, patientName: "Odin", weight: 43.0, techs: 2, category: "ORTHOPEDIC", type: "Fracture (femur)", incision: "09:05", suture: "10:50", ready: "11:20", notes: "HBC. Good alignment achieved." },
        { surgeonId: morgan.id, patientName: "Pip", weight: 5.5, techs: 1, category: "SOFT_TISSUE", type: "Spay", incision: "11:55", suture: "12:40", ready: "13:00" },
        { surgeonId: chen.id, patientName: "Kira", weight: 21.0, techs: 2, category: "ORTHOPEDIC", type: "MPL/CCL", incision: "13:35", suture: "14:40", ready: "15:00" },
      ],
    }],
  });

  // 25 days ago
  await makeDay({
    id: "d19", daysAgoN: 25, surgeonId: chen.id,
    depart: "07:20", returnArrival: "13:50",
    clinics: [{
      name: "Northside Emergency Vet", arrive: "08:15",
      cases: [
        { surgeonId: chen.id, patientName: "Bentley", weight: 27.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "08:50", suture: "10:20", ready: "10:50" },
        { surgeonId: chen.id, patientName: "Fern", weight: 6.0, techs: 1, category: "SOFT_TISSUE", type: "Tumor Removal", incision: "11:25", suture: "11:55", ready: "12:15" },
        { surgeonId: chen.id, patientName: "Beau", weight: 32.0, techs: 1, category: "SOFT_TISSUE", type: "Other (Soft Tissue)", incision: "12:45", suture: "13:30", ready: "13:45" },
      ],
    }],
  });

  // 28 days ago
  await makeDay({
    id: "d20", daysAgoN: 28, surgeonId: patel.id,
    depart: "07:10", returnArrival: "17:30",
    clinics: [
      {
        name: "Lakewood Animal Clinic", arrive: "08:05",
        cases: [
          { surgeonId: patel.id, patientName: "Apollo", weight: 36.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "08:45", suture: "11:30", ready: "12:10", notes: "Bilateral simultaneous TPLO. Excellent outcome." },
        ],
      },
      {
        name: "Riverside Animal Hospital", arrive: "13:05",
        cases: [
          { surgeonId: patel.id, patientName: "Sage", weight: 14.5, techs: 1, category: "SOFT_TISSUE", type: "Foreign Body", incision: "13:50", suture: "14:35", ready: "14:55" },
          { surgeonId: patel.id, patientName: "Thor", weight: 46.0, techs: 2, category: "ORTHOPEDIC", type: "Fracture (Humerus)", incision: "15:25", suture: "17:00", ready: "17:20" },
        ],
      },
    ],
  });

  // 29 days ago
  await makeDay({
    id: "d21", daysAgoN: 29, surgeonId: morgan.id,
    depart: "07:45", returnArrival: "15:40",
    clinics: [{
      name: "Hilltop Pet Hospital", arrive: "08:40",
      cases: [
        { surgeonId: morgan.id, patientName: "Maple", weight: 20.0, techs: 2, category: "ORTHOPEDIC", type: "FHO", incision: "09:10", suture: "10:15", ready: "10:40" },
        { surgeonId: morgan.id, patientName: "Scout", weight: 31.0, techs: 2, category: "ORTHOPEDIC", type: "TPLO", incision: "11:10", suture: "12:50", ready: "13:20" },
        { surgeonId: morgan.id, patientName: "Penny", weight: 8.5, techs: 1, category: "SOFT_TISSUE", type: "Spay", incision: "13:55", suture: "14:40", ready: "15:00" },
      ],
    }],
  });

  // Count totals
  const dayCount = await prisma.surgicalDay.count();
  const caseCount = await prisma.surgeryCase.count();
  const typeCount = await prisma.surgeryType.count();
  console.log(`\nSeed complete.`);
  console.log(`  Practice : ${practice.name} (join password: demo123)`);
  console.log(`  Surgeons : 3 (Dr. Patel [blue], Dr. Chen [green], Dr. Morgan [purple])`);
  console.log(`  Types    : ${typeCount} surgery types`);
  console.log(`  Days     : ${dayCount} over the last 30 days`);
  console.log(`  Cases    : ${caseCount} total`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
