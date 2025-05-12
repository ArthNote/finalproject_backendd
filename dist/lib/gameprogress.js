"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameProgress = void 0;
const prisma_1 = require("./prisma");
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
class GameProgress {
    awardTaskCompletionXP(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addXP(userId, XP_CONFIG.taskCompletion);
        });
    }
    awardGoalCompletionXP(userId, xpReward) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addXP(userId, xpReward);
        });
    }
    awardPomodoroCompletionXP(userId, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseXP = XP_CONFIG.pomodoro.baseXP;
            const minuteBonus = Math.round(duration * XP_CONFIG.pomodoro.perMinute);
            const totalXP = baseXP + minuteBonus;
            return this.addXP(userId, totalXP);
        });
    }
    updateStreak(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const progress = yield this.getUserProgress(userId);
            const now = new Date();
            const lastDate = new Date(progress.lastStreakDate);
            const isConsecutiveDay = now.getDate() - lastDate.getDate() === 1;
            if (isConsecutiveDay) {
                const newStreakDays = progress.streakDays + 1;
                const streakXP = Math.floor(XP_CONFIG.streak.base *
                    Math.pow(XP_CONFIG.streak.multiplier, newStreakDays - 1));
                yield prisma_1.db.userProgress.update({
                    where: { userId },
                    data: {
                        streakDays: newStreakDays,
                        lastStreakDate: now,
                        longestStreak: Math.max(newStreakDays, progress.longestStreak),
                    },
                });
                yield this.addXP(userId, streakXP);
                return newStreakDays;
            }
            yield prisma_1.db.userProgress.update({
                where: { userId },
                data: {
                    streakDays: 1,
                    lastStreakDate: now,
                },
            });
            return 1;
        });
    }
    addXP(userId, xpAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const progress = yield this.getUserProgress(userId);
            const newTotalXp = progress.totalXP + xpAmount;
            const newLevel = this.calculateLevel(newTotalXp);
            const prevLevelTotalXP = this.calculateTotalXPForLevel(newLevel - 1);
            const currentLevelXp = newTotalXp - prevLevelTotalXP;
            const updatedProgress = yield prisma_1.db.userProgress.update({
                where: { userId },
                data: {
                    level: newLevel,
                    currentXP: currentLevelXp,
                    totalXP: newTotalXp,
                },
            });
            if (newLevel > progress.level) {
                yield this.handleLevelUp(userId, newLevel);
            }
            return updatedProgress;
        });
    }
    getUserProgress(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let progress = yield prisma_1.db.userProgress.findUnique({
                where: { userId },
            });
            if (!progress) {
                progress = yield prisma_1.db.userProgress.create({
                    data: { userId },
                });
            }
            return progress;
        });
    }
    calculateLevel(totalXp) {
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
    calculateXPForLevel(level) {
        return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_SCALING, level - 1));
    }
    calculateTotalXPForLevel(level) {
        let total = 0;
        for (let i = 1; i <= level; i++) {
            total += this.calculateXPForLevel(i);
        }
        return total;
    }
    handleLevelUp(userId, newLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            const rewards = yield prisma_1.db.reward.findMany({
                where: {
                    unlockLevel: newLevel,
                },
            });
            yield Promise.all(rewards.map((reward) => prisma_1.db.userReward.create({
                data: {
                    userId,
                    rewardId: reward.id,
                    unlocked: true,
                    unlockedAt: new Date(),
                },
            })));
        });
    }
}
exports.GameProgress = GameProgress;
