/*
  Warnings:

  - Changed the type of `role` on the `InviteCode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "InviteCode" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;
