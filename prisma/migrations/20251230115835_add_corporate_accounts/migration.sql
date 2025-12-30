/*
  Warnings:

  - You are about to drop the column `accountType` on the `Company` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CorporateStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "accountType";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "corporateAccountId" TEXT;

-- DropEnum
DROP TYPE "AccountType";

-- CreateTable
CREATE TABLE "CorporateAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "billingEmail" TEXT,
    "status" "CorporateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorporateAccount_name_key" ON "CorporateAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateAccount_companyId_key" ON "CorporateAccount"("companyId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_corporateAccountId_idx" ON "User"("corporateAccountId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "CorporateAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateAccount" ADD CONSTRAINT "CorporateAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
