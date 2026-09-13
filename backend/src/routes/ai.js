import { Router } from "express";
import prisma from "../prisma/client.js";
import { auth, role } from "../middleware/auth.js";
import { getPatientId } from "../utils/profile.js";
import { getAppointmentWarnings } from "../utils/appointmentValidation.js";
import { getAIRecommendation } from "../utils/ai.js";
import { calculateAge } from "../utils/appointmentValidation.js";

const router = Router();

router.post("/check-booking", auth, role("patient"), async (req, res) => {
  try {
    const { doctorId, serviceId } = req.body;
    const patientId = await getPatientId(req.user.id);

    if (!patientId) {
      return res.status(404).json({ message: "Профиль пациента не найден" });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const doctor = await prisma.doctor.findUnique({ where: { id: Number(doctorId) } });

    if (!doctor) {
      return res.status(404).json({ message: "Врач не найден" });
    }

    let service = null;
    if (serviceId) {
      service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    }

    const warnings = getAppointmentWarnings(patient, doctor, service);
    res.json({ warnings, hasWarnings: warnings.length > 0 });
  } catch (err) {
    console.error("Check booking error:", err);
    res.status(500).json({ message: "Ошибка проверки записи" });
  }
});

router.post("/recommend", auth, role("patient"), async (req, res) => {
  try {
    const { complaints } = req.body;

    if (!complaints || complaints.trim().length < 5) {
      return res.status(400).json({ message: "Опишите жалобы подробнее (минимум 5 символов)" });
    }

    const patientId = await getPatientId(req.user.id);
    const patient = patientId
      ? await prisma.patient.findUnique({ where: { id: patientId } })
      : null;

    const patientInfo = {
      fullName: patient?.fullName,
      gender: patient?.gender,
      age: calculateAge(patient?.birthDate)
    };

    const result = await getAIRecommendation(complaints.trim(), patientInfo);

    const services = await prisma.service.findMany();
    const doctors = await prisma.doctor.findMany();
    const doctorServices = await prisma.doctorService.findMany();

    const enrichedSuggestions = (result.suggestions || []).map((s) => {
   
      let matchedService = services.find(
        (svc) => svc.name.toLowerCase() === s.service?.toLowerCase()
      );

      
      if (!matchedService) {
        matchedService = services.find(
          (svc) => svc.name.toLowerCase().includes(s.service?.toLowerCase()) ||
            s.service?.toLowerCase().includes(svc.name.toLowerCase())
        );
      }

      
      if (!matchedService) {
        matchedService = services.find((svc) => svc.category === s.category);
      }


      let matchedDoctor = doctors.find((d) => d.name === s.doctor);

      if (!matchedDoctor) {
        matchedDoctor = doctors.find((d) => d.specialty === s.specialty);
      }

    
      if (matchedService && matchedDoctor) {
        const hasService = doctorServices.some(
          ds => ds.doctorId === matchedDoctor.id && ds.serviceId === matchedService.id
        );

        if (!hasService) {
          
          const alternativeDoctor = doctorServices.find(
            ds => ds.serviceId === matchedService.id
          );

          if (alternativeDoctor) {
            matchedDoctor = doctors.find(d => d.id === alternativeDoctor.doctorId);
          } else {

            const doctorServiceIds = doctorServices
              .filter(ds => ds.doctorId === matchedDoctor.id)
              .map(ds => ds.serviceId);

            matchedService = services.find(svc => doctorServiceIds.includes(svc.id));
          }
        }
      }

      return {
        ...s,
        serviceId: matchedService?.id || null,
        serviceName: matchedService?.name || s.service,
        doctorId: matchedDoctor?.id || null,
        doctorName: matchedDoctor?.name || s.doctor,
        price: matchedService?.price || null
      };
    });

    res.json({
      reply: result.reply,
      suggestions: enrichedSuggestions,
      source: result.source
    });
  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ message: "Ошибка получения рекомендации" });
  }
});

export default router;
