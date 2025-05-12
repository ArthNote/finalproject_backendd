import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

/**
 * Get today's mood entry for the current user
 */
export async function getTodaysMood(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const moodEntry = await db.moodEntry.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: moodEntry,
    });
  } catch (error) {
    console.error("Error getting today's mood:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get today's mood entry",
    });
  }
}

/**
 * Get mood history for the current user
 */
export async function getMoodHistory(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get limit from query params, default to 30
    const limit = parseInt(req.query.limit as string) || 30;

    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    return res.status(200).json({
      success: true,
      data: moodEntries,
    });
  } catch (error) {
    console.error("Error getting mood history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get mood history",
    });
  }
}

/**
 * Create or update a mood entry
 */
export async function saveMoodEntry(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { mood, energy, note, date } = req.body;

    if (!mood || !energy || !date) {
      return res.status(400).json({
        success: false,
        message: "Mood, energy, and date are required",
      });
    }

    // Parse the date
    const parsedDate = parseISO(date);
    const dayStart = startOfDay(parsedDate);
    const dayEnd = endOfDay(parsedDate);

    // Check if entry already exists for this date
    const existingEntry = await db.moodEntry.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    let moodEntry;

    if (existingEntry) {
      // Update existing entry
      moodEntry = await db.moodEntry.update({
        where: {
          id: existingEntry.id,
        },
        data: {
          mood,
          energy,
          note: note || null,
          date: parsedDate,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new entry
      moodEntry = await db.moodEntry.create({
        data: {
          userId: session.user.id,
          mood,
          energy,
          note: note || null,
          date: parsedDate,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: moodEntry,
    });
  } catch (error) {
    console.error("Error saving mood entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save mood entry",
    });
  }
}

/**
 * Get mood for a specific date
 */
export async function getMoodByDate(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const dateParam = req.params.date;
    if (!dateParam) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    // Parse the date
    const parsedDate = parseISO(dateParam);
    const dayStart = startOfDay(parsedDate);
    const dayEnd = endOfDay(parsedDate);

    const moodEntry = await db.moodEntry.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: moodEntry,
    });
  } catch (error) {
    console.error("Error getting mood by date:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get mood entry for date",
    });
  }
}

/**
 * Delete a mood entry
 */
export async function deleteMoodEntry(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Entry ID is required",
      });
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.moodEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: "Mood entry not found",
      });
    }

    await db.moodEntry.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Mood entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete mood entry",
    });
  }
}
