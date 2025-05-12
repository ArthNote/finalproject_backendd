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
exports.getUserProgress = getUserProgress;
exports.getGoals = getGoals;
exports.updateGoalProgress = updateGoalProgress;
exports.updateStreak = updateStreak;
exports.getRewards = getRewards;
exports.getUnlockedRewards = getUnlockedRewards;
exports.unlockReward = unlockReward;
exports.generateGoals = generateGoals;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const gameprogress_1 = require("../lib/gameprogress");
const goalGenerator_1 = require("../lib/goalGenerator");
const gameProgress = new gameprogress_1.GameProgress();
function getUserProgress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const progress = yield prisma_1.db.userProgress.findUnique({
                where: { userId: session.user.id },
                include: {
                    goals: true,
                    rewards: {
                        include: {
                            reward: true,
                        },
                    },
                },
            });
            if (!progress) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1); // Set to yesterday
                const newProgress = yield prisma_1.db.userProgress.create({
                    data: {
                        userId: session.user.id,
                        level: 1,
                        currentXP: 0,
                        totalXP: 0,
                        streakDays: 0,
                        longestStreak: 0,
                        lastStreakDate: yesterday,
                    },
                    include: {
                        goals: true,
                        rewards: {
                            include: {
                                reward: true,
                            },
                        },
                    },
                });
                return res.status(200).json({
                    message: "User progress retrieved successfully",
                    success: true,
                    data: newProgress,
                    allGoalsCompleted: false,
                });
            }
            // --- Check and Reset Streak if Yesterday Was Missed ---
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const lastStreakDate = new Date(progress.lastStreakDate);
            lastStreakDate.setHours(0, 0, 0, 0);
            // If the last update was before yesterday, reset the streak
            if (progress.streakDays > 0 && lastStreakDate < yesterday) {
                yield prisma_1.db.userProgress.update({
                    where: { userId: session.user.id },
                    data: { streakDays: 0 },
                    include: {
                        goals: true,
                        rewards: {
                            include: {
                                reward: true,
                            },
                        },
                    },
                });
                console.log(`Streak reset for user ${session.user.id} due to missed day.`);
            }
            // Delete yesterday's goals
            const yesterdayStart = new Date(yesterday);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterday);
            yesterdayEnd.setHours(23, 59, 59, 999);
            yield prisma_1.db.goal.deleteMany({
                where: {
                    userId: progress.id,
                    type: "DAILY",
                    createdAt: {
                        gte: yesterdayStart,
                        lte: yesterdayEnd,
                    },
                },
            });
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            // Get all daily goals for today
            const dailyGoals = yield prisma_1.db.goal.findMany({
                where: {
                    userId: progress.id,
                    type: "DAILY",
                    targetDate: todayStart,
                },
            });
            let updatedProgress = progress;
            let allGoalsCompleted = false; // Default to false
            if (dailyGoals.length > 0) {
                // Check if all daily goals are completed
                allGoalsCompleted = dailyGoals.every((g) => g.status === "completed");
                // Only update streak if all goals are completed AND last streak update was before today
                const lastStreakDate = new Date(progress.lastStreakDate);
                lastStreakDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // Only update if: there are goals, all are completed, and streak wasn't already updated today
                if (allGoalsCompleted && lastStreakDate < today) {
                    const newStreakDays = progress.streakDays + 1;
                    updatedProgress = yield prisma_1.db.userProgress.update({
                        where: { userId: session.user.id },
                        data: {
                            streakDays: newStreakDays,
                            lastStreakDate: today, // Use today instead of new Date() to avoid time issues
                            longestStreak: {
                                increment: Math.max(newStreakDays, progress.longestStreak),
                            },
                        },
                        include: {
                            goals: true,
                            rewards: {
                                include: {
                                    reward: true,
                                },
                            },
                        },
                    });
                }
            }
            // Check and update Consistency King monthly goal progress
            const consistencyGoal = yield prisma_1.db.goal.findFirst({
                where: {
                    userId: progress.id,
                    type: "MONTHLY",
                    title: "Consistency King",
                    status: "in-progress",
                },
            });
            if (consistencyGoal) {
                // Calculate progress percentage (20 days = 100%)
                const streakProgress = Math.min(Math.floor((progress.streakDays / 20) * 100), 100);
                // Only update if the new progress is higher than current progress
                if (streakProgress > (consistencyGoal.progress || 0)) {
                    yield prisma_1.db.goal.update({
                        where: { id: consistencyGoal.id },
                        data: {
                            progress: streakProgress,
                            status: streakProgress >= 100 ? "completed" : "in-progress",
                            completedAt: streakProgress >= 100 ? new Date() : null,
                        },
                    });
                    // Award XP if goal is completed
                    if (streakProgress >= 100 && consistencyGoal.progress < 100) {
                        yield gameProgress.awardGoalCompletionXP(session.user.id, consistencyGoal.xpReward);
                    }
                }
            }
            return res.status(200).json({
                message: "User progress retrieved successfully",
                success: true,
                data: updatedProgress,
                allGoalsCompleted: dailyGoals,
            });
        }
        catch (error) {
            console.error("Error getting user progress:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function getGoals(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const goals = yield prisma_1.db.goal.findMany({
                where: {
                    userId: session.user.id,
                },
            });
            return res.status(200).json({
                message: "Goals retrieved successfully",
                success: true,
                data: goals,
            });
        }
        catch (error) {
            console.error("Error getting goals:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function updateGoalProgress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const { id } = req.params;
            const { progress } = req.body;
            const goal = yield prisma_1.db.goal.findFirst({
                where: {
                    id,
                    userId: session.user.id,
                },
            });
            if (!goal) {
                return res
                    .status(404)
                    .json({ message: "Goal not found", success: false });
            }
            // Update the current goal
            const updatedGoal = yield prisma_1.db.goal.update({
                where: { id },
                data: {
                    progress,
                    status: progress >= 100 ? "completed" : "in-progress",
                    completedAt: progress >= 100 ? new Date() : null,
                },
            });
            // If goal is completed, award XP
            if (progress >= 100 && goal.status !== "completed") {
                yield gameProgress.awardGoalCompletionXP(session.user.id, goal.xpReward);
                // Check all daily goals after completing this one
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                const dailyGoals = yield prisma_1.db.goal.findMany({
                    where: {
                        userId: session.user.id,
                        type: "DAILY",
                        createdAt: {
                            gte: todayStart,
                            lte: todayEnd,
                        },
                    },
                });
                const allGoalsCompleted = dailyGoals.every((g) => g.id === id ? progress >= 100 : g.status === "completed");
                if (dailyGoals.length > 0 && allGoalsCompleted) {
                    const userProgress = yield prisma_1.db.userProgress.findUnique({
                        where: { userId: session.user.id },
                    });
                    if (userProgress) {
                        const lastStreakDate = new Date(userProgress.lastStreakDate);
                        lastStreakDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (lastStreakDate < today) {
                            yield prisma_1.db.userProgress.update({
                                where: { userId: session.user.id },
                                data: {
                                    streakDays: {
                                        increment: 1,
                                    },
                                    lastStreakDate: new Date(),
                                    longestStreak: {
                                        increment: userProgress.streakDays >= userProgress.longestStreak
                                            ? 1
                                            : 0,
                                    },
                                },
                            });
                        }
                    }
                }
            }
            return res.status(200).json({
                message: "Goal progress updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating goal progress:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function updateStreak(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const streak = yield gameProgress.updateStreak(session.user.id);
            return res.status(200).json({
                message: "Streak updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating streak:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function getRewards(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const progress = yield prisma_1.db.userProgress.findUnique({
                where: { userId: session.user.id },
            });
            if (!progress) {
                return res
                    .status(404)
                    .json({ message: "User progress not found", success: false });
            }
            const rewards = yield prisma_1.db.reward.findMany({
                include: {
                    userRewards: {
                        where: {
                            userId: progress.id,
                        },
                    },
                },
            });
            return res.status(200).json(rewards); // Return the rewards array directly
        }
        catch (error) {
            console.error("Error getting rewards:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function getUnlockedRewards(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const progress = yield prisma_1.db.userProgress.findUnique({
                where: { userId: session.user.id },
            });
            if (!progress) {
                return res
                    .status(404)
                    .json({ message: "User progress not found", success: false });
            }
            const rewards = yield prisma_1.db.userReward.findMany({
                where: {
                    userId: progress.id,
                    unlocked: true,
                },
                include: {
                    reward: true,
                },
            });
            return res.status(200).json(rewards); // Return the rewards array directly
        }
        catch (error) {
            console.error("Error getting rewards:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function unlockReward(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const { id } = req.params;
            const reward = yield prisma_1.db.reward.findUnique({
                where: { id },
            });
            if (!reward) {
                return res
                    .status(404)
                    .json({ message: "Reward not found", success: false });
            }
            const userProgress = yield prisma_1.db.userProgress.findUnique({
                where: { userId: session.user.id },
            });
            if (!userProgress) {
                return res
                    .status(404)
                    .json({ message: "User progress not found", success: false });
            }
            // Check if level requirement is met
            if (reward.unlockLevel && userProgress.level < reward.unlockLevel) {
                return res
                    .status(400)
                    .json({ message: "Level requirement not met", success: false });
            }
            const unlockedReward = yield prisma_1.db.userReward.create({
                data: {
                    userId: userProgress.id,
                    rewardId: id,
                    unlocked: true,
                    unlockedAt: new Date(),
                },
            });
            return res.status(200).json({
                message: "Reward unlocked successfully",
                success: true,
                data: unlockedReward,
            });
        }
        catch (error) {
            console.error("Error unlocking reward:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
function generateGoals(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const goals = yield (0, goalGenerator_1.checkAndGenerateGoals)(session.user.id);
            return res.status(200).json({
                message: "Goals generated successfully",
                success: true,
                data: goals,
            });
        }
        catch (error) {
            console.error("Error generating goals:", error);
            return res.status(500).json({
                message: "Internal server error",
                success: false,
                error: error.message,
            });
        }
    });
}
