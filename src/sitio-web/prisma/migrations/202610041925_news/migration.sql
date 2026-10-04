-- Blog / Noticias (administrado por Dirección)
-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('BORRADOR', 'PUBLICADA');

-- CreateTable
CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageFile" TEXT,
    "status" "NewsStatus" NOT NULL DEFAULT 'BORRADOR',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_posts_slug_key" ON "news_posts"("slug");

-- CreateIndex
CREATE INDEX "news_posts_status_publishedAt_idx" ON "news_posts"("status", "publishedAt");
