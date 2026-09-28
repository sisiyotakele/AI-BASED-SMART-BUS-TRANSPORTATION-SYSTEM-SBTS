/*
  Warnings:

  - You are about to drop the column `frequency_minutes` on the `schedules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "key_handovers" DROP CONSTRAINT "key_handovers_to_shift_id_fkey";

-- AlterTable
ALTER TABLE "key_handovers" ALTER COLUMN "to_shift_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "frequency_minutes";

-- AddForeignKey
ALTER TABLE "key_handovers" ADD CONSTRAINT "key_handovers_to_shift_id_fkey" FOREIGN KEY ("to_shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
