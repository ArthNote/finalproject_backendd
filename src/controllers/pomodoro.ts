import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../lib/prisma";
import { GameProgress } from "../lib/gameprogress";

/**
 * Save a completed focus session
 */
export async function saveFocusSession(req: Request, res: Response) {
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
    const { duration, type, completed, startTime, endTime } = req.body;

    if (!duration || !type || startTime === undefined) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // Create the focus session
    const focusSession = await db.focusSession.create({
      data: {
        userId: session.user.id,
        duration,
        type,
        completed: completed || false,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
      },
    });

    // If this was a completed work session, update XP
    if (completed && type === "work") {
      const gameProgress = new GameProgress();
      await gameProgress.awardPomodoroCompletionXP(session.user.id, duration);

      // Update user's streak
      const userProgress = await db.userProgress.findUnique({
        where: { userId: session.user.id },
      });

      if (userProgress) {
        // Check if last streak was within the past day
        const lastStreak = new Date(userProgress.lastStreakDate);
        const now = new Date();
        const daysSinceLastStreak = Math.floor(
          (now.getTime() - lastStreak.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastStreak <= 1 && daysSinceLastStreak > 0) {
          // Increment streak
          await db.userProgress.update({
            where: { userId: session.user.id },
            data: {
              streakDays: userProgress.streakDays + 1,
              longestStreak: Math.max(
                userProgress.streakDays + 1,
                userProgress.longestStreak
              ),
              lastStreakDate: now,
            },
          });
        } else if (daysSinceLastStreak > 1) {
          // Reset streak
          await db.userProgress.update({
            where: { userId: session.user.id },
            data: {
              streakDays: 1,
              lastStreakDate: now,
            },
          });
        }

        // NEW CODE: Update focus-related daily goals
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find focus-related daily goals
        const dailyFocusGoals = await db.goal.findMany({
          where: {
            userId: userProgress.id,
            type: "DAILY",
            status: "in-progress",
            OR: [
              {
                title: {
                  contains: "Timer",
                  mode: "insensitive",
                },
              },
            ],
            targetDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        // Update each matching goal's progress
        for (const goal of dailyFocusGoals) {
          // Determine how much to increase progress based on session duration
          let newProgress = goal.progress;
          let sessionCompleted = false;

          // Check if this is a "Complete 3 sessions" type goal
          const sessionCountMatch = goal.title.match(
            /(\d+)\s*(pomodoro|session|timer)/i
          );
          if (sessionCountMatch && sessionCountMatch[1]) {
            const targetCount = parseInt(sessionCountMatch[1], 10);
            if (!isNaN(targetCount) && targetCount > 0) {
              // Add exactly 1/targetCount of progress (e.g., for 3 sessions, add 33.33%)
              newProgress = Math.min(100, goal.progress + 100 / targetCount);
              sessionCompleted = true;
            }
          }

          // If we didn't handle it as a session count goal, handle other types
          if (!sessionCompleted) {
            if (
              goal.title.toLowerCase().includes("minute") ||
              goal.title.toLowerCase().includes("min")
            ) {
              // Extract the target minutes from the goal title using regex
              const minutesMatch = goal.title.match(/(\d+)\s*(minute|min)/i);
              if (minutesMatch && minutesMatch[1]) {
                const targetMinutes = parseInt(minutesMatch[1], 10);
                if (!isNaN(targetMinutes) && targetMinutes > 0) {
                  // Calculate progress as percentage of target minutes
                  newProgress = Math.min(
                    100,
                    goal.progress + (duration / targetMinutes) * 100
                  );
                } else {
                  // Default increase if we couldn't parse the target minutes
                  newProgress = Math.min(100, goal.progress + 25);
                }
              } else {
                // Default increase if we couldn't parse the target minutes
                newProgress = Math.min(100, goal.progress + 25);
              }
            }
            // Generic "pomodoro" or "session" goals without a number
            else if (
              goal.title.toLowerCase().includes("pomodoro") ||
              goal.title.toLowerCase().includes("session") ||
              goal.title.toLowerCase().includes("timer")
            ) {
              // Default to assuming 3 sessions needed if no number specified
              newProgress = Math.min(100, goal.progress + 33.33);
            }
            // For any other focus-related goal, add a default progress increment
            else {
              newProgress = Math.min(100, goal.progress + 25);
            }
          }

          // Update the goal with new progress
          await db.goal.update({
            where: { id: goal.id },
            data: {
              progress: Math.round(newProgress),
              status: newProgress >= 100 ? "completed" : "in-progress",
              completedAt: newProgress >= 100 ? new Date() : null,
            },
          });

          // Award XP if goal was completed by this update
          if (newProgress >= 100 && goal.progress < 100) {
            await gameProgress.awardGoalCompletionXP(
              session.user.id,
              goal.xpReward
            );
          }
        }
      }
    }

    return res.status(200).json({
      message: "Focus session saved successfully",
      success: true,
      data: focusSession,
    });
  } catch (error) {
    console.error("Error saving focus session:", error);
    return res.status(500).json({
      message: "Error saving focus session: " + error,
      success: false,
    });
  }
}

/**
 * Get focus sessions history for the current user
 */
export async function getFocusSessions(req: Request, res: Response) {
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
    const { timeframe = "week" } = req.query;

    // Determine date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
        break;
    }

    // Fetch the focus sessions
    const focusSessions = await db.focusSession.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const totalWorkMinutes = focusSessions
      .filter((s) => s.type === "work" && s.completed)
      .reduce((acc, session) => acc + session.duration, 0);

    const totalSessions = focusSessions.filter(
      (s) => s.type === "work" && s.completed
    ).length;

    // Get user progress for streak
    const userProgress = await db.userProgress.findUnique({
      where: { userId: session.user.id },
      select: { streakDays: true },
    });

    return res.status(200).json({
      message: "Focus sessions retrieved successfully",
      success: true,
      data: focusSessions,
      stats: {
        totalWorkMinutes,
        totalSessions,
        streak: userProgress?.streakDays || 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving focus sessions:", error);
    return res.status(500).json({
      message: "Error retrieving focus sessions: " + error,
      success: false,
    });
  }
}

/**
 * Get detailed focus session statistics
 */
export async function getFocusSessionStats(req: Request, res: Response) {
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
    const { timeframe = "week" } = req.query;

    // Determine date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
        break;
    }

    // Fetch the focus sessions
    const focusSessions = await db.focusSession.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
        completed: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate total stats
    const totalWorkMinutes = focusSessions
      .filter((s) => s.type === "work")
      .reduce((acc, session) => acc + session.duration, 0);

    const totalSessions = focusSessions.filter((s) => s.type === "work").length;

    // Group sessions by day
    const sessionsMap = new Map();

    focusSessions.forEach((fs) => {
      const date = new Date(fs.createdAt);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!sessionsMap.has(dateStr)) {
        sessionsMap.set(dateStr, { minutes: 0, sessions: 0 });
      }

      if (fs.type === "work") {
        const entry = sessionsMap.get(dateStr);
        entry.minutes += fs.duration;
        entry.sessions += 1;
        sessionsMap.set(dateStr, entry);
      }
    });

    // Convert to array format
    const dailySessions = Array.from(sessionsMap.entries()).map(
      ([date, data]) => ({
        date,
        minutes: data.minutes,
        sessions: data.sessions,
      })
    );

    // Get user progress for streak
    const userProgress = await db.userProgress.findUnique({
      where: { userId: session.user.id },
      select: { streakDays: true },
    });

    return res.status(200).json({
      message: "Focus session stats retrieved successfully",
      success: true,
      data: {
        totalWorkMinutes,
        totalSessions,
        dailySessions,
        streak: userProgress?.streakDays || 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving focus session stats:", error);
    return res.status(500).json({
      message: "Error retrieving focus session stats: " + error,
      success: false,
    });
  }
}
