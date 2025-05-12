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
exports.getTodaysMood = getTodaysMood;
exports.getMoodHistory = getMoodHistory;
exports.saveMoodEntry = saveMoodEntry;
exports.getMoodByDate = getMoodByDate;
exports.deleteMoodEntry = deleteMoodEntry;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
/**
 * Get today's mood entry for the current user
 */
function getTodaysMood(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
            });
            if (!session) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const today = new Date();
            const todayStart = (0, date_fns_1.startOfDay)(today);
            const todayEnd = (0, date_fns_1.endOfDay)(today);
            const moodEntry = yield prisma_1.db.moodEntry.findFirst({
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
        }
        catch (error) {
            console.error("Error getting today's mood:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to get today's mood entry",
            });
        }
    });
}
/**
 * Get mood history for the current user
 */
function getMoodHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
            });
            if (!session) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            // Get limit from query params, default to 30
            const limit = parseInt(req.query.limit) || 30;
            const moodEntries = yield prisma_1.db.moodEntry.findMany({
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
        }
        catch (error) {
            console.error("Error getting mood history:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to get mood history",
            });
        }
    });
}
/**
 * Create or update a mood entry
 */
function saveMoodEntry(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
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
            const parsedDate = (0, date_fns_1.parseISO)(date);
            const dayStart = (0, date_fns_1.startOfDay)(parsedDate);
            const dayEnd = (0, date_fns_1.endOfDay)(parsedDate);
            // Check if entry already exists for this date
            const existingEntry = yield prisma_1.db.moodEntry.findFirst({
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
                moodEntry = yield prisma_1.db.moodEntry.update({
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
            }
            else {
                // Create new entry
                moodEntry = yield prisma_1.db.moodEntry.create({
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
        }
        catch (error) {
            console.error("Error saving mood entry:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to save mood entry",
            });
        }
    });
}
/**
 * Get mood for a specific date
 */
function getMoodByDate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
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
            const parsedDate = (0, date_fns_1.parseISO)(dateParam);
            const dayStart = (0, date_fns_1.startOfDay)(parsedDate);
            const dayEnd = (0, date_fns_1.endOfDay)(parsedDate);
            const moodEntry = yield prisma_1.db.moodEntry.findFirst({
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
        }
        catch (error) {
            console.error("Error getting mood by date:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to get mood entry for date",
            });
        }
    });
}
/**
 * Delete a mood entry
 */
function deleteMoodEntry(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
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
            const existingEntry = yield prisma_1.db.moodEntry.findFirst({
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
            yield prisma_1.db.moodEntry.delete({
                where: {
                    id,
                },
            });
            return res.status(200).json({
                success: true,
                message: "Mood entry deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting mood entry:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete mood entry",
            });
        }
    });
}
