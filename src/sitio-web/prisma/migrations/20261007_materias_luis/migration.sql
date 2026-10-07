-- Materias que enseña Luis Velazquez (director y docente):
-- 2.º BTI Algorítmica, 2.º BTE Física, 1.º/2.º/3.º BTS Matemáticas, 3.º CIV Matemáticas.
INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 2, 'Algorítmica', 'BTI-ALG' FROM "academics" a WHERE a."code" = 'BTI'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'BTI-ALG');

INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 2, 'Física', 'BTE-FIS' FROM "academics" a WHERE a."code" = 'BTE'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'BTE-FIS');

INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 1, 'Matemáticas', 'BTS-MAT1' FROM "academics" a WHERE a."code" = 'BTS'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'BTS-MAT1');

INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 2, 'Matemáticas', 'BTS-MAT2' FROM "academics" a WHERE a."code" = 'BTS'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'BTS-MAT2');

INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 3, 'Matemáticas', 'BTS-MAT3' FROM "academics" a WHERE a."code" = 'BTS'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'BTS-MAT3');

INSERT INTO "subjects" ("id", "academicId", "gradeYear", "name", "code")
SELECT gen_random_uuid(), a."id", 3, 'Matemáticas', 'CIV-MAT' FROM "academics" a WHERE a."code" = 'CIV'
AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."academicId" = a."id" AND s."code" = 'CIV-MAT');
