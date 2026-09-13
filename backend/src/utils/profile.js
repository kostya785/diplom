import prisma from "../prisma/client.js";

export async function getPatientId(userId) {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  return patient?.id ?? null;
}

export async function getDoctorId(userId) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  return doctor?.id ?? null;
}
