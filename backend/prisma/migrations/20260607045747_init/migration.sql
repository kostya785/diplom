
ALTER TABLE "Patient" DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL DEFAULT 'Unknown';
