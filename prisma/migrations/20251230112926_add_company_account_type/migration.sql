-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
