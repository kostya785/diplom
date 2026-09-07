import cron from "node-cron";
import prisma from "./prisma/client.js";
import { sendReminder } from "./telegram.js";

cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const windowStart = new Date(inTwoHours.getTime() - 5 * 60 * 1000);
    const windowEnd = new Date(inTwoHours.getTime() + 5 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: windowStart, lte: windowEnd },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        reminderSent: false
      },
      include: { patient: true, doctor: true, service: true }
    });

    for (const a of appointments) {
      if (a.patient.telegramChatId) {
        sendReminder(a.patient.telegramChatId, a);
        await prisma.appointment.update({
          where: { id: a.id },
          data: { reminderSent: true }
        });
      }
    }
  } catch (err) {
    console.error("Cron reminder error:", err);
  }
});
