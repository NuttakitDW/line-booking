import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.service.deleteMany();

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

  // Create time slots for the next 7 days
  const slots = [];
  const startHour = 9;
  const endHour = 18;

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);

    // Skip Sunday
    if (date.getDay() === 0) continue;

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

      slots.push(
        prisma.timeSlot.create({
          data: {
            date,
            startTime,
            endTime,
            available: true,
          },
        })
      );
    }
  }

  const createdSlots = await Promise.all(slots);
  console.log(`Created ${createdSlots.length} time slots`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
