import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../prisma/client.js";
import { auth, role, clinicAdmin } from "../middleware/auth.js";
import { getDoctorId, getPatientId } from "../utils/profile.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../../uploads/medical");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function detectFileType(mimeType, originalName) {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (
    mimeType === "application/dicom" ||
    originalName.toLowerCase().endsWith(".dcm") ||
    originalName.toLowerCase().endsWith(".dicom")
  ) {
    return "DICOM";
  }
  return "OTHER";
}

function parseBase64File(dataUrl) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], "base64")
  };
}

router.post("/", auth, role("doctor"), async (req, res) => {
  try {
    const { appointmentId, diagnosis, recommendations, treatment, attachments } = req.body;
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(appointmentId) },
      include: { patient: true }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Приём не найден" });
    }

    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ message: "Это не ваш приём" });
    }

    if (!diagnosis && !recommendations && !treatment && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Заполните хотя бы одно поле" });
    }

    const record = await prisma.medicalRecord.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId,
        diagnosis: diagnosis || null,
        recommendations: recommendations || null,
        treatment: treatment || null
      },
      update: {
        diagnosis: diagnosis || null,
        recommendations: recommendations || null,
        treatment: treatment || null
      }
    });

    const savedAttachments = [];

    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (!att.data || !att.name) continue;

        const parsed = parseBase64File(att.data);
        if (!parsed) continue;

        if (parsed.buffer.length > 50 * 1024 * 1024) {
          return res.status(400).json({ message: `Файл ${att.name} слишком большой (макс. 50 МБ)` });
        }

        const fileType = detectFileType(parsed.mimeType, att.name);
        const ext = path.extname(att.name) || (fileType === "DICOM" ? ".dcm" : "");
        const filename = `record_${record.id}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filepath, parsed.buffer);

        const saved = await prisma.medicalAttachment.create({
          data: {
            medicalRecordId: record.id,
            filename,
            originalName: att.name,
            mimeType: parsed.mimeType,
            fileSize: parsed.buffer.length,
            fileType
          }
        });

        savedAttachments.push(saved);
      }
    }

    const fullRecord = await prisma.medicalRecord.findUnique({
      where: { id: record.id },
      include: {
        attachments: true,
        doctor: { select: { name: true, specialty: true } },
        appointment: { include: { service: true } }
      }
    });

    if (appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "COMPLETED" }
      });
    }

    res.json({ ...fullRecord, attachments: [...fullRecord.attachments] });
  } catch (err) {
    console.error("Create medical record error:", err);
    res.status(500).json({ message: "Ошибка сохранения медицинской записи" });
  }
});

router.get("/my", auth, role("patient"), async (req, res) => {
  try {
    const patientId = await getPatientId(req.user.id);
    if (!patientId) {
      return res.status(404).json({ message: "Профиль пациента не найден" });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: { select: { name: true, specialty: true } },
        attachments: true,
        appointment: { include: { service: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(records);
  } catch (err) {
    console.error("Get patient records error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/doctor", auth, role("doctor"), async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { doctorId },
      include: {
        patient: { select: { fullName: true } },
        attachments: true,
        appointment: { include: { service: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(records);
  } catch (err) {
    console.error("Get doctor records error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/appointment/:appointmentId", auth, async (req, res) => {
  try {
    const appointmentId = Number(req.params.appointmentId);
    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId },
      include: {
        attachments: true,
        doctor: { select: { name: true, specialty: true } },
        patient: { select: { fullName: true } }
      }
    });

    if (!record) {
      return res.status(404).json({ message: "Запись не найдена" });
    }

    res.json(record);
  } catch (err) {
    console.error("Get record by appointment error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/attachment/:id", auth, async (req, res) => {
  try {
    const attachmentId = Number(req.params.id);
    const attachment = await prisma.medicalAttachment.findUnique({
      where: { id: attachmentId },
      include: { medicalRecord: true }
    });

    if (!attachment) {
      return res.status(404).json({ message: "Файл не найден" });
    }

   
    const doctorId = await getDoctorId(req.user.id);
    const patientId = await getPatientId(req.user.id);

    if (!doctorId && !patientId) {
      return res.status(403).json({ message: "Нет доступа" });
    }

    if (doctorId && attachment.medicalRecord.doctorId !== doctorId) {
      return res.status(403).json({ message: "Нет доступа к этому файлу" });
    }

    if (patientId && attachment.medicalRecord.patientId !== patientId) {
      return res.status(403).json({ message: "Нет доступа к этому файлу" });
    }

    const filepath = path.join(UPLOADS_DIR, attachment.filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "Файл не найден на сервере" });
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Get attachment error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
