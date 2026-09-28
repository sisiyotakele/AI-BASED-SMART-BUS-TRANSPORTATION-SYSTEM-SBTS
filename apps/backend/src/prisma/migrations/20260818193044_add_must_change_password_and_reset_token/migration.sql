-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_reset_expiry" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_token" VARCHAR(500);
