
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');


CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DICOM', 'OTHER');


ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED';


ALTER TABLE "Patient" ADD COLUMN "gender" "Gender",
ADD COLUMN "telegramUserId" BIGINT,
ADD COLUMN "telegramChatId" BIGINT,
ADD COLUMN "telegramLinkToken" TEXT;


ALTER TABLE "Appointment" ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;


CREATE UNIQUE INDEX "Patient_telegramLinkToken_key" ON "Patient"("telegramLinkToken");


CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "diagnosis" TEXT,
    "recommendations" TEXT,
    "treatment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalAttachment" (
    "id" SERIAL NOT NULL,
    "medicalRecordId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" "AttachmentType" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "MedicalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalAttachment" ADD CONSTRAINT "MedicalAttachment_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
