import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, techAdmin, clinicAdmin } from "../middleware/auth.js";
import { switchDatabase as switchDb, getCurrentDatabase as getCurrentDb } from "../prisma/client.js";

const router = Router();



router.get("/users", auth, techAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        banReason: true,
        banUntil: true
      }
    });

    res.json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.patch("/role/:id", auth, techAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role: newRole } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: newRole,
        emailVerified: newRole !== "patient"
      }
    });

    res.json(user);
  } catch (err) {
    console.error("Admin change role error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.post("/ban/:id", auth, techAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, banUntil } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: reason,
        banUntil: banUntil ? new Date(banUntil) : null
      }
    });

    res.json(user);
  } catch (err) {
    console.error("Admin ban error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.post("/unban/:id", auth, techAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
        banUntil: null
      }
    });

    res.json(user);
  } catch (err) {
    console.error("Admin unban error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.post("/reset-password/:id", auth, techAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { newPassword } = req.body;

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id },
      data: {
        password: hash
      }
    });

    res.json({ message: "Пароль сброшен" });
  } catch (err) {
    console.error("Admin reset password error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.delete("/users/:id", auth, techAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    console.log("Attempting to delete user with ID:", id);


    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            appointments: true,
            schedule: true,
            medicalRecords: true,
            services: true
          }
        },
        patient: {
          include: {
            appointments: true,
            medicalRecords: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    console.log("User found:", { id: user.id, email: user.email, role: user.role });


    console.log("Deleting auth logs...");
    await prisma.authLog.deleteMany({
      where: { userId: id }
    });


    if (user.doctor) {
      console.log("Deleting doctor and related data...");
   
      await prisma.schedule.deleteMany({
        where: { doctorId: user.doctor.id }
      });
  
      await prisma.doctorService.deleteMany({
        where: { doctorId: user.doctor.id }
      });
   
      await prisma.appointment.deleteMany({
        where: { doctorId: user.doctor.id }
      });
    
      await prisma.medicalRecord.deleteMany({
        where: { doctorId: user.doctor.id }
      });
  
      await prisma.doctor.delete({
        where: { id: user.doctor.id }
      });
    }

    if (user.patient) {
      console.log("Deleting patient and related data...");
    
      await prisma.appointment.deleteMany({
        where: { patientId: user.patient.id }
      });
    
      await prisma.medicalRecord.deleteMany({
        where: { patientId: user.patient.id }
      });
  
      await prisma.patient.delete({
        where: { id: user.patient.id }
      });
    }

    console.log("Deleting user...");

    await prisma.user.delete({
      where: { id }
    });

    console.log("User deleted successfully");
    res.json({ message: "Пользователь полностью удалён" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Ошибка сервера: " + err.message });
  }
});



router.get("/database/current", auth, techAdmin, (req, res) => {
  res.json({ currentDatabase: getCurrentDb() });
});



router.post("/database/switch", auth, techAdmin, async (req, res) => {
  try {
    const { target } = req.body;
    const result = switchDb(target);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Database switch error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});



router.get("/auth-logs", auth, techAdmin, async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;

    const where = userId ? { userId: Number(userId) } : {};

    const logs = await prisma.authLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json(logs);
  } catch (err) {
    console.error("Auth logs error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
