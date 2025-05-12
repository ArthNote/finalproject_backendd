import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../lib/prisma";
import { GameProgress } from "../lib/gameprogress";
import { checkAndGenerateGoals } from "../lib/goalGenerator";

const gameProgress = new GameProgress();

export async function getUserProgress(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }
  try {
    const progress = await db.userProgress.findUnique({
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
      const newProgress = await db.userProgress.create({
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
      await db.userProgress.update({
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
      console.log(
        `Streak reset for user ${session.user.id} due to missed day.`
      );
    }

    // Delete yesterday's goals
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    await db.goal.deleteMany({
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
    const dailyGoals = await db.goal.findMany({
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
        updatedProgress = await db.userProgress.update({
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
    const consistencyGoal = await db.goal.findFirst({
      where: {
        userId: progress.id,
        type: "MONTHLY",
        title: "Consistency King",
        status: "in-progress",
      },
    });

    if (consistencyGoal) {
      // Calculate progress percentage (20 days = 100%)
      const streakProgress = Math.min(
        Math.floor((progress.streakDays / 20) * 100),
        100
      );

      // Only update if the new progress is higher than current progress
      if (streakProgress > (consistencyGoal.progress || 0)) {
        await db.goal.update({
          where: { id: consistencyGoal.id },
          data: {
            progress: streakProgress,
            status: streakProgress >= 100 ? "completed" : "in-progress",
            completedAt: streakProgress >= 100 ? new Date() : null,
          },
        });

        // Award XP if goal is completed
        if (streakProgress >= 100 && consistencyGoal.progress < 100) {
          await gameProgress.awardGoalCompletionXP(
            session.user.id,
            consistencyGoal.xpReward
          );
        }
      }
    }

    return res.status(200).json({
      message: "User progress retrieved successfully",
      success: true,
      data: updatedProgress,
      allGoalsCompleted: dailyGoals,
    });
  } catch (error: any) {
    console.error("Error getting user progress:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function getGoals(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const goals = await db.goal.findMany({
      where: {
        userId: session.user.id,
      },
    });

    return res.status(200).json({
      message: "Goals retrieved successfully",
      success: true,
      data: goals,
    });
  } catch (error: any) {
    console.error("Error getting goals:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function updateGoalProgress(
  req: Request<{ id: string }, {}, { progress: number }>,
  res: Response
) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
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

    const goal = await db.goal.findFirst({
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
    const updatedGoal = await db.goal.update({
      where: { id },
      data: {
        progress,
        status: progress >= 100 ? "completed" : "in-progress",
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    // If goal is completed, award XP
    if (progress >= 100 && goal.status !== "completed") {
      await gameProgress.awardGoalCompletionXP(session.user.id, goal.xpReward);

      // Check all daily goals after completing this one
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const dailyGoals = await db.goal.findMany({
        where: {
          userId: session.user.id,
          type: "DAILY",
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const allGoalsCompleted = dailyGoals.every((g) =>
        g.id === id ? progress >= 100 : g.status === "completed"
      );

      if (dailyGoals.length > 0 && allGoalsCompleted) {
        const userProgress = await db.userProgress.findUnique({
          where: { userId: session.user.id },
        });

        if (userProgress) {
          const lastStreakDate = new Date(userProgress.lastStreakDate);
          lastStreakDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (lastStreakDate < today) {
            await db.userProgress.update({
              where: { userId: session.user.id },
              data: {
                streakDays: {
                  increment: 1,
                },
                lastStreakDate: new Date(),
                longestStreak: {
                  increment:
                    userProgress.streakDays >= userProgress.longestStreak
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
  } catch (error: any) {
    console.error("Error updating goal progress:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function updateStreak(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const streak = await gameProgress.updateStreak(session.user.id);
    return res.status(200).json({
      message: "Streak updated successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("Error updating streak:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function getRewards(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }
  try {

    const progress = await db.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      return res
        .status(404)
        .json({ message: "User progress not found", success: false });
    }
    const rewards = await db.reward.findMany({
      include: {
        userRewards: {
          where: {
            userId: progress.id,
          },
        },
      },
    });

    return res.status(200).json(rewards); // Return the rewards array directly
  } catch (error: any) {
    console.error("Error getting rewards:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function getUnlockedRewards(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }
  try {
    const progress = await db.userProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      return res
        .status(404)
        .json({ message: "User progress not found", success: false });
    }

    const rewards = await db.userReward.findMany({
      where: {
        userId: progress.id,
        unlocked: true,
      },
      include: {
        reward: true,
      },
    });

    return res.status(200).json(rewards); // Return the rewards array directly
  } catch (error: any) {
    console.error("Error getting rewards:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function unlockReward(
  req: Request<{ id: string }>,
  res: Response
) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
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

    const reward = await db.reward.findUnique({
      where: { id },
    });

    if (!reward) {
      return res
        .status(404)
        .json({ message: "Reward not found", success: false });
    }

    const userProgress = await db.userProgress.findUnique({
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

    const unlockedReward = await db.userReward.create({
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
  } catch (error: any) {
    console.error("Error unlocking reward:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}

export async function generateGoals(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const goals = await checkAndGenerateGoals(session.user.id);

    return res.status(200).json({
      message: "Goals generated successfully",
      success: true,
      data: goals,
    });
  } catch (error: any) {
    console.error("Error generating goals:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
}
