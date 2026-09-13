
CREATE TABLE "DoctorService" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "DoctorService_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "DoctorService_doctorId_serviceId_key" ON "DoctorService"("doctorId", "serviceId");


ALTER TABLE "DoctorService" ADD CONSTRAINT "DoctorService_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "DoctorService" ADD CONSTRAINT "DoctorService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
