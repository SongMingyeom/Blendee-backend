-- AlterTable
ALTER TABLE "Canvas" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);
