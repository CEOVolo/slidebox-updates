/*
  Warnings:

  - You are about to drop the `SlideUserType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SlideUserType" DROP CONSTRAINT "SlideUserType_slideId_fkey";

-- DropForeignKey
ALTER TABLE "SlideUserType" DROP CONSTRAINT "SlideUserType_userTypeId_fkey";

-- DropTable
DROP TABLE "SlideUserType";

-- DropTable
DROP TABLE "UserType";

-- CreateTable
CREATE TABLE "SlideConfidentiality" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "confidentialityId" TEXT NOT NULL,

    CONSTRAINT "SlideConfidentiality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confidentiality" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Confidentiality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlideConfidentiality_slideId_confidentialityId_key" ON "SlideConfidentiality"("slideId", "confidentialityId");

-- CreateIndex
CREATE UNIQUE INDEX "Confidentiality_code_key" ON "Confidentiality"("code");

-- AddForeignKey
ALTER TABLE "SlideConfidentiality" ADD CONSTRAINT "SlideConfidentiality_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideConfidentiality" ADD CONSTRAINT "SlideConfidentiality_confidentialityId_fkey" FOREIGN KEY ("confidentialityId") REFERENCES "Confidentiality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
