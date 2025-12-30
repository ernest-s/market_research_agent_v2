/*
  Warnings:

  - The values [CLOSED] on the enum `CorporateStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CorporateStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');
ALTER TABLE "public"."CorporateAccount" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CorporateAccount" ALTER COLUMN "status" TYPE "CorporateStatus_new" USING ("status"::text::"CorporateStatus_new");
ALTER TYPE "CorporateStatus" RENAME TO "CorporateStatus_old";
ALTER TYPE "CorporateStatus_new" RENAME TO "CorporateStatus";
DROP TYPE "public"."CorporateStatus_old";
ALTER TABLE "CorporateAccount" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropIndex
DROP INDEX "CorporateAccount_name_key";

-- DropIndex
DROP INDEX "User_companyId_idx";

-- DropIndex
DROP INDEX "User_corporateAccountId_idx";
