-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatMessageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "chatMessageLimit" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lastChatMessageAt" TIMESTAMP(3);
