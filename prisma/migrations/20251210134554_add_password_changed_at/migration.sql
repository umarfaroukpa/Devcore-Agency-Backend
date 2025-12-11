-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL', 'WELCOME_CLIENT', 'PASSWORD_RESET', 'PROJECT_INVITE', 'APPLICATION_RECEIVED', 'TASK_ASSIGNED', 'PROJECT_UPDATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'TASK_DELETED';
ALTER TYPE "ActivityType" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "ActivityType" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_createdAt_idx" ON "PasswordReset"("createdAt");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
