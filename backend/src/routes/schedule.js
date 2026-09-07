import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, role, clinicAdmin } from "../middleware/auth.js";
import { getDoctorId } from "../utils/profile.js";
import { slotTimestamp } from "../utils/date.js";

const router = Router();

router.post("/", auth, role("doctor"), async (req, res) => {
  try {
    const { day, startTime, endTime, interval } = req.body;
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    const schedule = await prisma.schedule.create({
      data: {
        doctorId,
        day: new Date(day),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        interval
      }
    });

    console.log("Расписание создано:", schedule);
    res.json(schedule);
  } catch (err) {
    console.error("Schedule error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.get("/doctor/me", auth, role("doctor"), async (req, res) => {
  try {
    console.log("Загрузка расписания для user ID:", req.user.id);
    const doctorId = await getDoctorId(req.user.id);
    console.log("🔍 Получен doctorId:", doctorId);

    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    const schedule = await prisma.schedule.findMany({
      where: { doctorId },
      orderBy: { day: "asc" }
    });

    console.log("Найдено расписаний:", schedule.length);
    res.json(schedule);
  } catch (err) {
    console.error("My schedule error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/doctor/:id", async (req, res) => {
  try {
    const doctorId = Number(req.params.id);

    if (!doctorId) {
      return res.status(400).json({ message: "Не указан ID врача" });
    }

    const schedule = await prisma.schedule.findMany({
      where: { doctorId },
      orderBy: { day: "asc" }
    });

    res.json(schedule);
  } catch (err) {
    console.error("Schedule by doctor ID error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/slots/:doctorId", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const now = new Date();

    const schedule = await prisma.schedule.findMany({
      where: {
        doctorId,
        day: { gte: new Date(now.toDateString()) }
      }
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { not: "CANCELED" }
      }
    });

    const busy = new Set(appointments.map((a) => slotTimestamp(a.date)));

    const slots = [];

    for (const s of schedule) {
      let current = new Date(s.startTime);
      const end = new Date(s.endTime);

      while (current < end) {
        if (current > now && !busy.has(slotTimestamp(current))) {
          slots.push(current.toISOString());
        }
        current = new Date(current.getTime() + s.interval * 60000);
      }
    }

    slots.sort();
    res.json(slots);
  } catch (err) {
    console.error("Slots error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
