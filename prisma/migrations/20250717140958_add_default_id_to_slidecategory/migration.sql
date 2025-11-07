-- Add default value for id column in SlideCategory
ALTER TABLE "SlideCategory" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();