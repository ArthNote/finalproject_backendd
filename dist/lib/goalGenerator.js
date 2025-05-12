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
exports.generateDailyGoals = generateDailyGoals;
exports.generateWeeklyGoals = generateWeeklyGoals;
exports.generateMonthlyGoals = generateMonthlyGoals;
exports.checkAndGenerateGoals = checkAndGenerateGoals;
const prisma_1 = require("./prisma");
const dailyGoalTemplates = [
    {
        title: "Complete 5 Tasks",
        description: "Complete any 5 tasks today",
        type: "DAILY",
        xpReward: 1001,
    },
    {
        title: "Use Pomodoro Timer",
        description: "Complete 3 Pomodoro sessions",
        type: "DAILY",
        xpReward: 75,
    },
    {
        title: "Plan Tasks",
        description: "Schedule at least 3 tasks for better time management",
        type: "DAILY",
        xpReward: 50,
    },
];
const weeklyGoalTemplates = [
    {
        title: "Complete 20 Tasks",
        description: "Complete any 20 tasks this week",
        type: "WEEKLY",
        xpReward: 300,
    },
    {
        title: "Maintain 5-day Streak",
        description: "Log in and complete tasks for 5 consecutive days",
        type: "WEEKLY",
        xpReward: 250,
    },
];
const monthlyGoalTemplates = [
    {
        title: "Power User",
        description: "Complete 100 tasks this month",
        type: "MONTHLY",
        xpReward: 1000,
    },
    {
        title: "Consistency King",
        description: "Maintain a 20-day streak",
        type: "MONTHLY",
        xpReward: 800,
    },
];
function ensureUserProgress(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let userProgress = yield prisma_1.db.userProgress.findUnique({
            where: { userId },
        });
        if (!userProgress) {
            userProgress = yield prisma_1.db.userProgress.create({
                data: {
                    userId,
                    level: 1,
                    currentXP: 0,
                    totalXP: 0,
                    streakDays: 0,
                    longestStreak: 0,
                },
            });
        }
        return userProgress;
    });
}
function generateDailyGoals(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userProgress = yield ensureUserProgress(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existingGoals = yield prisma_1.db.goal.findMany({
            where: {
                userId: userProgress.id,
                type: "DAILY",
                startDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        if (existingGoals.length > 0) {
            return existingGoals;
        }
        const goals = yield Promise.all(dailyGoalTemplates.map((template) => prisma_1.db.goal.create({
            data: Object.assign(Object.assign({}, template), { userId: userProgress.id, startDate: today, endDate: tomorrow, targetDate: today }),
        })));
        return goals;
    });
}
function generateWeeklyGoals(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userProgress = yield ensureUserProgress(userId);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        const existingGoals = yield prisma_1.db.goal.findMany({
            where: {
                userId: userProgress.id,
                type: "WEEKLY",
                startDate: {
                    gte: startOfWeek,
                    lt: endOfWeek,
                },
            },
        });
        if (existingGoals.length > 0) {
            return existingGoals;
        }
        const goals = yield Promise.all(weeklyGoalTemplates.map((template) => prisma_1.db.goal.create({
            data: Object.assign(Object.assign({}, template), { userId: userProgress.id, startDate: startOfWeek, endDate: endOfWeek }),
        })));
        return goals;
    });
}
function generateMonthlyGoals(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userProgress = yield ensureUserProgress(userId);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const existingGoals = yield prisma_1.db.goal.findMany({
            where: {
                userId: userProgress.id,
                type: "MONTHLY",
                startDate: {
                    gte: startOfMonth,
                    lt: endOfMonth,
                },
            },
        });
        if (existingGoals.length > 0) {
            return existingGoals;
        }
        const goals = yield Promise.all(monthlyGoalTemplates.map((template) => prisma_1.db.goal.create({
            data: Object.assign(Object.assign({}, template), { userId: userProgress.id, startDate: startOfMonth, endDate: endOfMonth }),
        })));
        return goals;
    });
}
function checkAndGenerateGoals(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const dailyGoals = yield generateDailyGoals(userId);
        const weeklyGoals = yield generateWeeklyGoals(userId);
        const monthlyGoals = yield generateMonthlyGoals(userId);
        return {
            dailyGoals,
            weeklyGoals,
            monthlyGoals,
        };
    });
}
