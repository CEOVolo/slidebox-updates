-- CreateTable
CREATE TABLE "SlideCategory" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "SlideCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlideCategory_slideId_categoryId_key" ON "SlideCategory"("slideId", "categoryId");

-- AddForeignKey
ALTER TABLE "SlideCategory" ADD CONSTRAINT "SlideCategory_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlideCategory" ADD CONSTRAINT "SlideCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
