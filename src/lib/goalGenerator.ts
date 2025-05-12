import { db } from "./prisma";
import { GoalType } from "../../prisma/src/app/generated/prisma/client";

interface GoalTemplate {
  title: string;
  description: string;
  type: GoalType;
  xpReward: number;
}

const dailyGoalTemplates: GoalTemplate[] = [
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

const weeklyGoalTemplates: GoalTemplate[] = [
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

const monthlyGoalTemplates: GoalTemplate[] = [
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

async function ensureUserProgress(userId: string) {
  let userProgress = await db.userProgress.findUnique({
    where: { userId },
  });

  if (!userProgress) {
    userProgress = await db.userProgress.create({
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
}

export async function generateDailyGoals(userId: string) {
  const userProgress = await ensureUserProgress(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const existingGoals = await db.goal.findMany({
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


  const goals = await Promise.all(
    dailyGoalTemplates.map((template) =>
      db.goal.create({
        data: {
          ...template,
          userId: userProgress.id,
          startDate: today,
          endDate: tomorrow,
          targetDate: today,
        },
      })
    )
  );

  return goals;
}

export async function generateWeeklyGoals(userId: string) {
  const userProgress = await ensureUserProgress(userId);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);


  const existingGoals = await db.goal.findMany({
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

  const goals = await Promise.all(
    weeklyGoalTemplates.map((template) =>
      db.goal.create({
        data: {
          ...template,
          userId: userProgress.id,
          startDate: startOfWeek,
          endDate: endOfWeek,
        },
      })
    )
  );

  return goals;
}

export async function generateMonthlyGoals(userId: string) {
  const userProgress = await ensureUserProgress(userId);
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);


  const existingGoals = await db.goal.findMany({
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


  const goals = await Promise.all(
    monthlyGoalTemplates.map((template) =>
      db.goal.create({
        data: {
          ...template,
          userId: userProgress.id,
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      })
    )
  );

  return goals;
}

export async function checkAndGenerateGoals(userId: string) {
  const dailyGoals = await generateDailyGoals(userId);
  const weeklyGoals = await generateWeeklyGoals(userId);
  const monthlyGoals = await generateMonthlyGoals(userId);

  return {
    dailyGoals,
    weeklyGoals,
    monthlyGoals,
  };
}
