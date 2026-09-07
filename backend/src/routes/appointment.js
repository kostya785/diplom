import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, role, clinicAdmin } from "../middleware/auth.js";
import { getPatientId, getDoctorId } from "../utils/profile.js";
import { normalizeSlotDate, slotTimestamp } from "../utils/date.js";
import { sendBookingConfirmation } from "../telegram.js";

const router = Router();

function parseServiceId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

router.post("/", auth, role("patient"), async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    const patientId = await getPatientId(req.user.id);

    if (!patientId) {
      return res.status(404).json({ message: "Профиль пациента не найден" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorId: Number(doctorId),
        patientId,
        date: normalizeSlotDate(date)
      }
    });

    res.json(appointment);
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/book", auth, role("patient"), async (req, res) => {
  try {
    const { doctorId, serviceId, date, paid } = req.body;
    const patientId = await getPatientId(req.user.id);

    if (!patientId) {
      return res.status(404).json({ message: "Профиль пациента не найден" });
    }

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Укажите врача и время" });
    }

    const parsedDoctorId = Number(doctorId);
    const parsedServiceId = parseServiceId(serviceId);
    const slotDate = normalizeSlotDate(date);
    const ts = slotTimestamp(slotDate);

    const doctor = await prisma.doctor.findUnique({ where: { id: parsedDoctorId } });
    if (!doctor) {
      return res.status(404).json({ message: "Врач не найден" });
    }

    if (parsedServiceId) {
      const service = await prisma.service.findUnique({ where: { id: parsedServiceId } });
      if (!service) {
        return res.status(404).json({ message: "Услуга не найдена" });
      }
    }


    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (doctor.specialty === "Уролог" && patient?.gender === "FEMALE") {
      return res.status(400).json({
        message: "Уролог специализируется на лечении мужчин. Пожалуйста, выберите другого врача."
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: parsedDoctorId,
        status: { not: "CANCELED" }
      }
    });

    const isBusy = appointments.some((a) => slotTimestamp(a.date) === ts);
    if (isBusy) {
      return res.status(409).json({ message: "Это время уже занято" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorId: parsedDoctorId,
        patientId,
        serviceId: parsedServiceId,
        date: slotDate,
        paid: Boolean(paid)
      },
      include: {
        doctor: true,
        service: true,
        patient: true
      }
    });

    console.log("✅ Запись создана:", {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor?.name,
      patientId: appointment.patientId,
      patientName: appointment.patient?.fullName,
      date: appointment.date
    });

    if (appointment.patient.telegramChatId) {
      sendBookingConfirmation(appointment.patient.telegramChatId, appointment);
    }

    res.json(appointment);
  } catch (err) {
    console.error("Book error:", err);
    res.status(500).json({ message: err.message || "Ошибка сервера" });
  }
});

router.get("/my", auth, role("patient"), async (req, res) => {
  try {
    const patientId = await getPatientId(req.user.id);

    if (!patientId) {
      return res.status(404).json({ message: "Профиль пациента не найден" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: true,
        service: true
      },
      orderBy: { date: "asc" }
    });

    res.json(appointments);
  } catch (err) {
    console.error("My appointments error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/doctor", auth, role("doctor"), async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    console.log("🔍 Запрос записей для врача ID:", doctorId, "User ID:", req.user.id);

    const appointments = await prisma.appointment.findMany({
      where: { doctorId, status: { not: "CANCELED" } },
      include: {
        patient: {
          include: {
            user: { select: { email: true } }
          }
        },
        service: true,
        medicalRecord: {
          include: { attachments: true }
        }
      },
      orderBy: { date: "asc" }
    });

    console.log("📋 Найдено записей:", appointments.length);
    appointments.forEach(a => {
      console.log("  - ID:", a.id, "Пациент:", a.patient?.fullName, "Дата:", a.date, "Статус:", a.status);
    });

    res.json(appointments);
  } catch (err) {
    console.error("Doctor appointments error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/", auth, clinicAdmin, async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: {
      doctor: true,
      patient: true,
      service: true
    },
    orderBy: { date: "desc" }
  });

  res.json(appointments);
});

router.delete("/:id", auth, role("patient"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const patientId = await getPatientId(req.user.id);

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return res.status(404).json({ message: "Запись не найдена" });
    }

    if (appointment.patientId !== patientId) {
      return res.status(403).json({ message: "Это не ваша запись" });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELED" }
    });

    res.json({ message: "Запись отменена" });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
