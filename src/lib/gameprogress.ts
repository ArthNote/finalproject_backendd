import { db } from "./prisma";

const XP_CONFIG = {
  taskCompletion: 50,
  goalCompletion: {
    daily: 100,
    weekly: 300,
    monthly: 1000,
    milestone: 2000,
  },
  streak: {
    base: 50,
    multiplier: 1.2,
  },
  pomodoro: {
    baseXP: 20,
    perMinute: 0.8,
  },
};

const XP_PER_LEVEL = 1000;
const LEVEL_SCALING = 1.5;

export class GameProgress {
  async awardTaskCompletionXP(userId: string) {
    return this.addXP(userId, XP_CONFIG.taskCompletion);
  }

  async awardGoalCompletionXP(userId: string, xpReward: number) {
    return this.addXP(userId, xpReward);
  }

  async awardPomodoroCompletionXP(userId: string, duration: number) {
    const baseXP = XP_CONFIG.pomodoro.baseXP;
    const minuteBonus = Math.round(duration * XP_CONFIG.pomodoro.perMinute);
    const totalXP = baseXP + minuteBonus;

    return this.addXP(userId, totalXP);
  }

  async updateStreak(userId: string) {
    const progress = await this.getUserProgress(userId);
    const now = new Date();
    const lastDate = new Date(progress.lastStreakDate);

    const isConsecutiveDay = now.getDate() - lastDate.getDate() === 1;

    if (isConsecutiveDay) {
      const newStreakDays = progress.streakDays + 1;
      const streakXP = Math.floor(
        XP_CONFIG.streak.base *
          Math.pow(XP_CONFIG.streak.multiplier, newStreakDays - 1)
      );

      await db.userProgress.update({
        where: { userId },
        data: {
          streakDays: newStreakDays,
          lastStreakDate: now,
          longestStreak: Math.max(newStreakDays, progress.longestStreak),
        },
      });

      await this.addXP(userId, streakXP);
      return newStreakDays;
    }

    await db.userProgress.update({
      where: { userId },
      data: {
        streakDays: 1,
        lastStreakDate: now,
      },
    });

    return 1;
  }

  private async addXP(userId: string, xpAmount: number) {
    const progress = await this.getUserProgress(userId);
    const newTotalXp = progress.totalXP + xpAmount;
    const newLevel = this.calculateLevel(newTotalXp);

    const prevLevelTotalXP = this.calculateTotalXPForLevel(newLevel - 1);
    const currentLevelXp = newTotalXp - prevLevelTotalXP;

    const updatedProgress = await db.userProgress.update({
      where: { userId },
      data: {
        level: newLevel,
        currentXP: currentLevelXp,
        totalXP: newTotalXp,
      },
    });

    if (newLevel > progress.level) {
      await this.handleLevelUp(userId, newLevel);
    }

    return updatedProgress;
  }

  private async getUserProgress(userId: string) {
    let progress = await db.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await db.userProgress.create({
        data: { userId },
      });
    }

    return progress;
  }

  private calculateLevel(totalXp: number): number {
    let level = 1;
    let xpNeeded = XP_PER_LEVEL;
    let accumulatedXP = 0;

    while (accumulatedXP + xpNeeded <= totalXp) {
      accumulatedXP += xpNeeded;
      level++;
      xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_SCALING, level - 1));
    }

    return level;
  }

  private calculateXPForLevel(level: number): number {
    return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_SCALING, level - 1));
  }

  private calculateTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += this.calculateXPForLevel(i);
    }
    return total;
  }

  private async handleLevelUp(userId: string, newLevel: number) {
    const rewards = await db.reward.findMany({
      where: {
        unlockLevel: newLevel,
      },
    });

    await Promise.all(
      rewards.map((reward) =>
        db.userReward.create({
          data: {
            userId,
            rewardId: reward.id,
            unlocked: true,
            unlockedAt: new Date(),
          },
        })
      )
    );
  }
}
