-- AlterTable
ALTER TABLE "ebook_purchases" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "ebook_purchases" ADD CONSTRAINT "ebook_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
