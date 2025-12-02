/*
  Warnings:

  - Added the required column `createdBy` to the `InviteCode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER_CREATED', 'USER_APPROVED', 'USER_DELETED', 'USER_UPDATED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'TASK_CREATED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'ROLE_CHANGED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable InviteCode
ALTER TABLE "InviteCode" ADD COLUMN "createdBy" TEXT;

-- Manual step added to populate existing data
UPDATE "InviteCode" SET "createdBy" = 'b5078512-07a8-48b8-b27b-e9c5f212f0a1' WHERE "createdBy" IS NULL; 
-- 👆 REPLACE THIS ID with a valid Admin user's ID

ALTER TABLE "InviteCode" ALTER COLUMN "createdBy" SET NOT NULL;
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "actualHours" INTEGER,
ADD COLUMN     "estimatedHours" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canApproveUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAssignTasks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canDeleteUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageProjects" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewAllProjects" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "invitedBy" TEXT;

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
