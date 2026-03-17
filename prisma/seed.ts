import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Buffer.from(hash)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.setting.deleteMany();

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "ตัดผมชาย",
        description: "ตัดผม สระผม เป่าแห้ง",
        durationMin: 45,
        price: 30000, // ฿300
      },
    }),
    prisma.service.create({
      data: {
        name: "ตัดผมหญิง",
        description: "ตัดผม สระผม ไดร์จัดทรง",
        durationMin: 60,
        price: 50000, // ฿500
      },
    }),
    prisma.service.create({
      data: {
        name: "ทำสีผม",
        description: "ย้อมสีผม พร้อมทรีทเมนท์",
        durationMin: 120,
        price: 150000, // ฿1,500
      },
    }),
    prisma.service.create({
      data: {
        name: "ดัดผม",
        description: "ดัดผม ดิจิตอลเพิร์ม",
        durationMin: 150,
        price: 200000, // ฿2,000
      },
    }),
    prisma.service.create({
      data: {
        name: "ทรีทเมนท์",
        description: "บำรุงเส้นผม ดูแลหนังศีรษะ",
        durationMin: 30,
        price: 80000, // ฿800
      },
    }),
  ]);

  console.log(`Created ${services.length} services`);

  // Create schedule rules (Mon-Sat, 9am-6pm, 1hr slots)
  const schedules = await Promise.all(
    [1, 2, 3, 4, 5, 6].map((day) =>
      prisma.schedule.create({
        data: {
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          slotDuration: 60,
          active: true,
        },
      })
    )
  );

  // Sunday off
  await prisma.schedule.create({
    data: {
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "18:00",
      slotDuration: 60,
      active: false,
    },
  });

  console.log(`Created ${schedules.length + 1} schedule rules`);

  // Create default settings
  await prisma.setting.create({
    data: { key: "maxAdvanceBookingDays", value: "60" },
  });

  console.log("Created default settings");

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await hashPassword(adminPassword);

  await prisma.adminUser.deleteMany();
  await prisma.adminUser.create({
    data: {
      username: "admin",
      passwordHash,
    },
  });

  console.log(`Created admin user (username: admin, password: ${adminPassword})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
