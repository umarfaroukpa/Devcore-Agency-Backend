/*
  Warnings:

  - You are about to drop the column `performedBy` on the `activity_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_performedBy_fkey";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "performedBy",
ADD COLUMN     "performedById" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_performedById_idx" ON "activity_logs"("performedById");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "activity_logs"("type");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
