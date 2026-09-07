import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, clinicAdmin } from "../middleware/auth.js";

const router = Router();


router.post("/", auth, clinicAdmin, async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    const service = await prisma.service.create({
      data: {
        name,
        price: Number(price),
        description,
        category
      }
    });

    res.json(service);
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.get("/", async (req, res) => {
  const services = await prisma.service.findMany();
  res.json(services);
});



router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    const doctorServices = await prisma.doctorService.findMany({
      where: { doctorId },
      include: {
        service: true
      }
    });

    const services = doctorServices.map(ds => ds.service);
    res.json(services);
  } catch (err) {
    console.error("Get services by doctor error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const service = await prisma.service.findUnique({
    where: { id }
  });

  if (!service) return res.status(404).json({ message: "Не найдено" });

  res.json(service);
});

router.delete("/:id", auth, clinicAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        appointments: true,
        doctors: true
      }
    });

    if (!service) {
      return res.status(404).json({ message: "Услуга не найдена" });
    }

    if (service.appointments.length > 0) {
      return res.status(400).json({ 
        message: "Невозможно удалить услугу с существующими записями" 
      });
    }


    await prisma.doctorService.deleteMany({
      where: { serviceId: id }
    });


    await prisma.service.delete({
      where: { id }
    });

    res.json({ message: "Услуга удалена" });
  } catch (err) {
    console.error("Delete service error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
