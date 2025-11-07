-- CreateEnum
CREATE TYPE "SlideStatus" AS ENUM ('draft', 'in_review', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "SlideFormat" AS ENUM ('vertical', 'horizontal');

-- CreateEnum
CREATE TYPE "SlideLanguage" AS ENUM ('en', 'fr', 'de', 'multilang');

-- CreateEnum
CREATE TYPE "SlideRegion" AS ENUM ('emea', 'na', 'global', 'apac', 'latam');

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "subcategory" TEXT,
    "figmaFileId" TEXT NOT NULL,
    "figmaNodeId" TEXT NOT NULL,
    "figmaFileName" TEXT,
    "figmaUrl" TEXT,
    "imageUrl" TEXT,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "extractedText" TEXT,
    "authorId" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorName" TEXT,
    "department" TEXT,
    "domain" TEXT,
    "format" "SlideFormat",
    "isCaseStudy" BOOLEAN NOT NULL DEFAULT false,
    "language" "SlideLanguage" NOT NULL DEFAULT 'en',
    "region" "SlideRegion" NOT NULL DEFAULT 'global',
    "status" "SlideStatus" NOT NULL DEFAULT 'draft',
    "yearFinish" INTEGER,
    "yearStart" INTEGER,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideProduct" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "SlideProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideUserType" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "userTypeId" TEXT NOT NULL,

    CONSTRAINT "SlideUserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideComponent" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,

    CONSTRAINT "SlideComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideIntegration" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "SlideIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SolutionArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideSolutionArea" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "solutionAreaId" TEXT NOT NULL,

    CONSTRAINT "SlideSolutionArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlideTag" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "SlideTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "authorId" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationSlide" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PresentationSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FigmaFileSync" (
    "id" TEXT NOT NULL,
    "figmaFileId" TEXT NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FigmaFileSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteSlide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SlideProduct_slideId_productId_key" ON "SlideProduct"("slideId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "UserType_code_key" ON "UserType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SlideUserType_slideId_userTypeId_key" ON "SlideUserType"("slideId", "userTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Component_code_key" ON "Component"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SlideComponent_slideId_componentId_key" ON "SlideComponent"("slideId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_code_key" ON "Integration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SlideIntegration_slideId_integrationId_key" ON "SlideIntegration"("slideId", "integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionArea_code_key" ON "SolutionArea"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SlideSolutionArea_slideId_solutionAreaId_key" ON "SlideSolutionArea"("slideId", "solutionAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SlideTag_slideId_tagId_key" ON "SlideTag"("slideId", "tagId");

-- CreateIndex
CREATE INDEX "PresentationSlide_presentationId_order_idx" ON "PresentationSlide"("presentationId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PresentationSlide_presentationId_slideId_key" ON "PresentationSlide"("presentationId", "slideId");

-- CreateIndex
CREATE UNIQUE INDEX "FigmaFileSync_figmaFileId_key" ON "FigmaFileSync"("figmaFileId");

-- CreateIndex
CREATE INDEX "FigmaFileSync_figmaFileId_idx" ON "FigmaFileSync"("figmaFileId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteSlide_userId_slideId_key" ON "FavoriteSlide"("userId", "slideId");

-- AddForeignKey
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideProduct" ADD CONSTRAINT "SlideProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideProduct" ADD CONSTRAINT "SlideProduct_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideUserType" ADD CONSTRAINT "SlideUserType_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideUserType" ADD CONSTRAINT "SlideUserType_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "UserType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideComponent" ADD CONSTRAINT "SlideComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideComponent" ADD CONSTRAINT "SlideComponent_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideIntegration" ADD CONSTRAINT "SlideIntegration_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideIntegration" ADD CONSTRAINT "SlideIntegration_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideSolutionArea" ADD CONSTRAINT "SlideSolutionArea_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideSolutionArea" ADD CONSTRAINT "SlideSolutionArea_solutionAreaId_fkey" FOREIGN KEY ("solutionAreaId") REFERENCES "SolutionArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideTag" ADD CONSTRAINT "SlideTag_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideTag" ADD CONSTRAINT "SlideTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationSlide" ADD CONSTRAINT "PresentationSlide_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationSlide" ADD CONSTRAINT "PresentationSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSlide" ADD CONSTRAINT "FavoriteSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSlide" ADD CONSTRAINT "FavoriteSlide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
