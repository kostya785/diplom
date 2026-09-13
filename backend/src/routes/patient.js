import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, role, clinicAdmin } from "../middleware/auth.js";
import { generateTelegramLinkToken } from "../utils/ai.js";

const router = Router();

router.get("/me", auth, role("patient"), async (req, res) => {
  try {
    let patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { email: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ message: "Пациент не найден" });
    }

    if (!patient.telegramLinkToken) {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { telegramLinkToken: generateTelegramLinkToken() },
        include: { user: { select: { email: true } } }
      });
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "konstantinopol_med_bot";
    const telegramLink = `https://t.me/${botUsername}?start=${patient.telegramLinkToken}`;

    res.json({
      ...patient,
      telegramUserId: patient.telegramUserId?.toString() || null,
      telegramChatId: patient.telegramChatId?.toString() || null,
      telegramLink
    });
  } catch (err) {
    console.error("Patient /me error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/", auth, clinicAdmin, async (req, res) => {
  try {
    const { userId, fullName, phone, birthDate, gender, address } = req.body;

    const patient = await prisma.patient.create({
      data: {
        userId,
        fullName,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        address
      }
    });

    res.json(patient);
  } catch (err) {
    console.error("Create patient error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/", auth, clinicAdmin, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: { select: { email: true } }
      }
    });

    res.json(patients);
  } catch (err) {
    console.error("Get all patients error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/:id", auth, clinicAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ message: "Пациент не найден" });
    }

    res.json(patient);
  } catch (err) {
    console.error("Get patient by id error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
