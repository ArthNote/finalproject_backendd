-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'MILESTONE');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('THEME', 'AVATAR', 'BADGE', 'POWER_UP', 'TITLE', 'BACKGROUND', 'WIDGET', 'FEATURE');

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXP" INTEGER NOT NULL DEFAULT 0,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "unlockLevel" INTEGER,
    "cost" INTEGER,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_id_key" ON "user_progress"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_key" ON "user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "goal_id_key" ON "goal"("id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_id_key" ON "milestone"("id");

-- CreateIndex
CREATE UNIQUE INDEX "reward_id_key" ON "reward"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reward_id_key" ON "user_reward"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reward_userId_rewardId_key" ON "user_reward"("userId", "rewardId");

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reward" ADD CONSTRAINT "user_reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reward" ADD CONSTRAINT "user_reward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
