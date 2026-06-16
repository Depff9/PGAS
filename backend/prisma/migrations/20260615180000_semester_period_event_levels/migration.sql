-- Submission period (winter/summer) per academic year
ALTER TABLE "Submission" ADD COLUMN "period" TEXT NOT NULL DEFAULT 'summer';

CREATE UNIQUE INDEX "Submission_userId_academicYear_period_key"
  ON "Submission"("userId", "academicYear", "period");

-- Event levels moved from ScoringMatrix into Regulation
ALTER TABLE "Regulation" ADD COLUMN "eventLevels" JSONB;

UPDATE "Regulation"
SET "eventLevels" = '[
  {"id":"faculty","label":"Внутривузовский"},
  {"id":"regional","label":"Региональный"},
  {"id":"federal","label":"Всероссийский"},
  {"id":"international","label":"Международный"}
]'::jsonb
WHERE "id" = 1 AND "eventLevels" IS NULL;

DROP TABLE IF EXISTS "ScoringMatrix";
