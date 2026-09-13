import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../prisma/client.js";
import { auth, role, clinicAdmin } from "../middleware/auth.js";
import { getDoctorId } from "../utils/profile.js";
import bcrypt from "bcryptjs";
import { sendAppointmentCancellationEmail } from "../utils/email.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../../uploads/doctors");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

router.post("/", auth, clinicAdmin, async (req, res) => {
  try {
    const { email, password, name, specialty, description, serviceIds } = req.body;

    if (!email || !password || !name || !specialty) {
      return res.status(400).json({ message: "Заполните обязательные поля" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: "doctor"
      }
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        name,
        specialty,
        description
      }
    });

 
    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      await prisma.doctorService.createMany({
        data: serviceIds.map((serviceId) => ({
          doctorId: doctor.id,
          serviceId: Number(serviceId)
        }))
      });
    }

    res.json({ user, doctor });
  } catch (err) {
    console.error("Create doctor error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/me", auth, role("doctor"), async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { email: true } }
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    res.json(doctor);
  } catch (err) {
    console.error("Doctor me error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/me/photo", auth, role("doctor"), async (req, res) => {
  try {
    const { photo } = req.body;

    if (!photo || !photo.startsWith("data:image/")) {
      return res.status(400).json({ message: "Некорректное изображение" });
    }

    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) {
      return res.status(404).json({ message: "Профиль врача не найден" });
    }

    const matches = photo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: "Некорректный формат изображения" });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Файл слишком большой (макс. 5 МБ)" });
    }

    const filename = `doctor_${doctorId}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    const existing = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (existing?.photoUrl && existing.photoUrl !== filename) {
      const oldPath = path.join(UPLOADS_DIR, existing.photoUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    fs.writeFileSync(filepath, buffer);

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { photoUrl: filename }
    });

    res.json(updated);
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Ошибка загрузки фото" });
  }
});

router.get("/", async (req, res) => {
  const doctors = await prisma.doctor.findMany({
    where: {
      deletedAt: null
    },
    include: {
      user: {
        select: { email: true }
      },
      services: {
        include: {
          service: true
        }
      }
    }
  });

  res.json(doctors);
});

router.get("/specialty/:name", async (req, res) => {
  const specialty = req.params.name;

  const doctors = await prisma.doctor.findMany({
    where: { specialty },
    include: {
      user: { select: { email: true } }
    }
  });

  res.json(doctors);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true }
      }
    }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Врач не найден" });
  }

  res.json(doctor);
});

router.put("/:id", auth, clinicAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, specialty, description, email, serviceIds } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Врач не найден" });
    }


    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        name: name || doctor.name,
        specialty: specialty || doctor.specialty,
        description: description !== undefined ? description : doctor.description
      }
    });

  
    if (email && email !== doctor.user.email) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: { email }
      });
    }


    if (serviceIds && Array.isArray(serviceIds)) {

      await prisma.doctorService.deleteMany({
        where: { doctorId: id }
      });

   
      if (serviceIds.length > 0) {
        await prisma.doctorService.createMany({
          data: serviceIds.map((serviceId) => ({
            doctorId: id,
            serviceId: Number(serviceId)
          }))
        });
      }
    }

    res.json(updatedDoctor);
  } catch (err) {
    console.error("Update doctor error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.delete("/:id", auth, clinicAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    console.log("Delete doctor request for ID:", id);

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
        appointments: {
          where: {
            date: { gte: new Date() },
            status: { not: "CANCELED" }
          }
        }
      }
    });

    if (!doctor) {
      console.log("Doctor not found with ID:", id);
      return res.status(404).json({ message: "Врач не найден" });
    }

    if (doctor.deletedAt) {
      console.log("Doctor already deleted with ID:", id);
      return res.status(400).json({ message: "Врач уже удалён" });
    }

    console.log("Found doctor:", doctor.name, "with", doctor.appointments.length, "future appointments");

   
    const canceledAppointments = [];
    for (const appointment of doctor.appointments) {
      const canceled = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CANCELED"
        }
      });
      canceledAppointments.push(canceled);

     
      const patient = await prisma.patient.findUnique({
        where: { id: appointment.patientId },
        include: { user: true }
      });

      if (patient?.user?.email) {
        try {
          await sendAppointmentCancellationEmail(
            patient.user.email,
            patient.fullName,
            doctor.name,
            appointment.date,
            "Врач уволен"
          );
        } catch (emailError) {
          console.error("Failed to send cancellation email:", emailError);
        }
      }
    }

    const deletedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    console.log("Doctor soft deleted successfully:", deletedDoctor.name);

    res.json({
      doctor: deletedDoctor,
      canceledAppointments: canceledAppointments.length,
      message: `Врач удалён. Отменено записей: ${canceledAppointments.length}`
    });
  } catch (err) {
    console.error("Delete doctor error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
