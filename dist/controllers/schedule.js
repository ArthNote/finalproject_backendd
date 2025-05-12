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
exports.schedule = schedule;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const scheduler_1 = require("../lib/schedueling/scheduler");
const gameprogress_1 = require("../lib/gameprogress");
const schedulerPrefs_1 = require("./schedulerPrefs");
function schedule(req, res) {
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
            const { customRangeEnd, customRangeStart, taskSelectionMode, timePeriodType, isBuiltIn, schedulerModeId } = req.query;
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            let dateRange = {
                start: today,
                end: today,
            };
            switch (timePeriodType) {
                case "today":
                    dateRange.end = new Date(today);
                    dateRange.end.setHours(23, 59, 59, 999);
                    break;
                case "tomorrow":
                    dateRange.start = new Date(today);
                    dateRange.start.setDate(today.getDate() + 1);
                    dateRange.end = new Date(dateRange.start);
                    dateRange.end.setHours(23, 59, 59, 999);
                    break;
                case "this_week":
                    const endOfWeek = new Date(today);
                    const daysUntilEndOfWeek = 7 - today.getDay();
                    endOfWeek.setDate(today.getDate() + daysUntilEndOfWeek);
                    endOfWeek.setHours(23, 59, 59, 999);
                    dateRange.end = endOfWeek;
                    break;
                case "custom":
                    dateRange = {
                        start: new Date(customRangeStart),
                        end: new Date(customRangeEnd),
                    };
                    break;
            }
            const whereConditions = {
                completed: false,
                OR: [
                    // Get tasks within the date range
                    {
                        date: {
                            gte: dateRange.start,
                            lte: dateRange.end,
                        },
                    },
                    // Include unscheduled tasks for full/unscheduled modes
                    ...(taskSelectionMode !== "reschedule"
                        ? [
                            {
                                AND: [{ date: null }, { scheduled: false }],
                            },
                        ]
                        : []),
                ],
                // User access conditions
                AND: [
                    {
                        OR: [
                            { userId: session.user.id },
                            { assignedTo: { some: { userId: session.user.id } } },
                            {
                                team: {
                                    organization: {
                                        members: { some: { userId: session.user.id } },
                                    },
                                },
                            },
                        ],
                    },
                ],
            };
            const dbTasks = yield prisma_1.db.task.findMany({
                where: whereConditions,
                include: {
                    assignedTo: {
                        include: {
                            user: true,
                        },
                    },
                    team: true,
                    resources: true,
                    subTasks: true,
                },
            });
            if (dbTasks.length === 0) {
                return res.status(200).json({
                    message: "No tasks to schedule",
                    success: true,
                });
            }
            const tasks = dbTasks.map((task) => {
                var _a;
                return ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    category: task.category,
                    completed: task.completed,
                    scheduled: task.scheduled,
                    date: task.date,
                    startTime: task.startTime || undefined,
                    endTime: task.endTime || undefined,
                    duration: task.duration || undefined,
                    tags: task.tags || [],
                    status: task.status || "todo",
                    parentId: task.parentId || undefined,
                    resources: (task.resources || []).map((resource) => {
                        var _a;
                        return (Object.assign(Object.assign({}, resource), { url: (_a = resource.url) !== null && _a !== void 0 ? _a : undefined, category: resource.category }));
                    }),
                    assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => ({
                        id: assignment.user.id,
                        name: assignment.user.name,
                        profilePic: assignment.user.image || undefined,
                    }))) || [],
                    projectId: task.projectId || undefined,
                    teamId: task.teamId || undefined,
                    createdAt: task.createdAt,
                });
            });
            let schedulerMode = null;
            if (schedulerModeId) {
                if (isBuiltIn === true) {
                    schedulerMode =
                        schedulerPrefs_1.BUILT_IN_MODES.find((mode) => mode.id === schedulerModeId) || null;
                }
                else {
                    const userMode = yield prisma_1.db.schedulerMode.findFirst({
                        where: {
                            id: schedulerModeId,
                            userId: session.user.id,
                        },
                    });
                    if (userMode) {
                        schedulerMode = {
                            id: userMode.id,
                            name: userMode.name,
                            description: userMode.description || "",
                            isDefault: false,
                            isBuiltIn: false,
                            isPreferred: userMode.isPreferred,
                            config: userMode.config,
                        };
                    }
                }
            }
            if (!schedulerMode) {
                schedulerMode =
                    schedulerPrefs_1.BUILT_IN_MODES.find((mode) => mode.id === "standard" || mode.id === "default" || mode.isDefault) || schedulerPrefs_1.BUILT_IN_MODES[0];
            }
            let moodAdjustments = undefined;
            if (schedulerMode.config.considerMood) {
                const dateRange = timePeriodType === "custom"
                    ? { start: new Date(customRangeStart), end: new Date(customRangeEnd) }
                    : getTimePeriodFromType(timePeriodType);
                const moodEntries = yield prisma_1.db.moodEntry.findMany({
                    where: {
                        userId: session.user.id,
                        date: {
                            gte: dateRange.start,
                            lte: dateRange.end,
                        },
                    },
                });
                moodAdjustments = {};
                for (const entry of moodEntries) {
                    const dateKey = entry.date.toISOString().split("T")[0];
                    const moodFactor = getMoodFactor(entry.mood);
                    const energyFactor = entry.energy / 10;
                    moodAdjustments[dateKey] = (moodFactor + energyFactor) / 2;
                }
            }
            const schedulerOptions = {
                taskSelectionMode: taskSelectionMode,
                timePeriod: Object.assign({ type: timePeriodType }, (timePeriodType === "custom" && {
                    customRange: {
                        start: dateRange.start,
                        end: dateRange.end,
                    },
                })),
                defaultDuration: schedulerMode.config.defaultDuration,
                maxTasksPerDay: schedulerMode.config.maxTasksPerDay,
                maxHoursPerDay: schedulerMode.config.maxHoursPerDay,
                energyLevels: schedulerMode.config.energyLevels,
                priorityLimits: schedulerMode.config.priorityLimits,
                timeSlotInterval: schedulerMode.config.timeSlotInterval,
                breakBetweenTasks: schedulerMode.config.breakBetweenTasks,
                dailySchedule: schedulerMode.config.dailySchedule,
                optimization: schedulerMode.config.optimization,
                considerMood: schedulerMode.config.considerMood || false,
                moodAdjustments: moodAdjustments,
                userId: session.user.id,
            };
            // Schedule tasks with the appropriate options
            const scheduledTasks = (0, scheduler_1.scheduleTasks)(tasks, schedulerOptions);
            yield Promise.all(scheduledTasks.map((task) => prisma_1.db.task.update({
                where: { id: task.id },
                data: {
                    scheduled: task.scheduled,
                    date: task.date,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    duration: task.duration,
                    priority: task.priority,
                },
            })));
            // Update planning tasks goal progress
            const userProgress = yield prisma_1.db.userProgress.findUnique({
                where: { userId: session.user.id },
                include: {
                    goals: {
                        where: {
                            type: "DAILY",
                            title: { contains: "Plan Tasks" },
                            status: "in-progress",
                        },
                    },
                },
            });
            if ((userProgress === null || userProgress === void 0 ? void 0 : userProgress.goals) && userProgress.goals.length > 0) {
                const planningGoal = userProgress.goals[0];
                const currentProgress = planningGoal.progress || 0;
                const progressIncrement = Math.min(scheduledTasks.length * 33, // 33% per task, need 3 tasks for 100%
                100 - currentProgress // don't exceed 100%
                );
                if (progressIncrement > 0) {
                    yield prisma_1.db.goal.update({
                        where: { id: planningGoal.id },
                        data: {
                            progress: currentProgress + progressIncrement,
                            status: currentProgress + progressIncrement >= 100
                                ? "completed"
                                : "in-progress",
                            completedAt: currentProgress + progressIncrement >= 100 ? new Date() : null,
                        },
                    });
                    // Award XP if goal is completed
                    if (currentProgress + progressIncrement >= 100 &&
                        currentProgress < 100) {
                        const gameProgress = new gameprogress_1.GameProgress();
                        yield gameProgress.awardGoalCompletionXP(session.user.id, planningGoal.xpReward);
                    }
                }
            }
            const scheduledTaskIds = scheduledTasks.map((task) => task.id);
            const tasksToReset = dbTasks.filter((task) => !scheduledTaskIds.includes(task.id));
            if (tasksToReset.length > 0) {
                yield Promise.all(tasksToReset.map((task) => prisma_1.db.task.update({
                    where: { id: task.id },
                    data: {
                        scheduled: false,
                        startTime: null,
                        endTime: null,
                    },
                })));
            }
            return res.status(200).json({
                message: "Tasks scheduled successfully",
                success: true,
                data: scheduledTasks,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error scheduling tasks",
                success: false,
                error: error.message,
            });
        }
    });
}
// Helper function to convert mood string to factor
function getMoodFactor(mood) {
    switch (mood.toLowerCase()) {
        case "great":
            return 1.0;
        case "good":
            return 0.8;
        case "neutral":
            return 0.6;
        case "bad":
            return 0.4;
        case "awful":
            return 0.2;
        default:
            return 0.6;
    }
}
// Helper function to get date range from period type
function getTimePeriodFromType(periodType) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    switch (periodType) {
        case "today":
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);
            return { start: today, end: endOfToday };
        case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);
            return { start: tomorrow, end: endOfTomorrow };
        case "this_week":
            const endOfWeek = new Date(today);
            const daysUntilEndOfWeek = 7 - today.getDay();
            endOfWeek.setDate(today.getDate() + daysUntilEndOfWeek);
            endOfWeek.setHours(23, 59, 59, 999);
            return { start: today, end: endOfWeek };
        default:
            return { start: today, end: today };
    }
}
