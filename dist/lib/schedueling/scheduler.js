"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleTasks = scheduleTasks;
// Keep DEFAULT_DAILY_SCHEDULE and DEFAULT_OPTIONS unchanged
const DEFAULT_DAILY_SCHEDULE = [
    {
        day: 1,
        availableFrom: "08:00",
        availableTo: "18:00",
        blockedIntervals: [{ start: "12:00", end: "13:00" }],
    },
    {
        day: 2,
        availableFrom: "08:00",
        availableTo: "18:00",
        blockedIntervals: [{ start: "12:00", end: "13:00" }],
    },
    {
        day: 3,
        availableFrom: "08:00",
        availableTo: "18:00",
        blockedIntervals: [{ start: "12:00", end: "13:00" }],
    },
    {
        day: 4,
        availableFrom: "08:00",
        availableTo: "18:00",
        blockedIntervals: [{ start: "12:00", end: "13:00" }],
    },
    {
        day: 5,
        availableFrom: "08:00",
        availableTo: "18:00",
        blockedIntervals: [{ start: "12:00", end: "13:00" }],
    },
];
const DEFAULT_OPTIONS = {
    defaultDuration: 45,
    maxTasksPerDay: 6,
    maxHoursPerDay: 7,
    considerMood: false,
    energyLevels: {
        highEnergyHours: ["08:00", "09:00", "10:00", "14:00"],
        mediumEnergyHours: ["11:00", "15:00", "16:00"],
        lowEnergyHours: ["13:00", "17:00", "18:00"],
    },
    priorityLimits: {
        urgent: 2,
        high: 2,
        medium: 3,
        low: 3,
    },
    timeSlotInterval: 15,
    breakBetweenTasks: 10,
    dailySchedule: DEFAULT_DAILY_SCHEDULE,
    taskSelectionMode: "full",
    timePeriod: { type: "today" },
    optimization: {
        respectFixedAppointments: true,
        addBreaks: {
            enabled: true,
            lunchBreak: {
                start: "12:00",
                duration: 60,
            },
            shortBreaks: {
                frequency: 90,
                duration: 10,
            },
        },
        optimizeFocusTime: true,
    },
};
const priorityMap = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
};
const priorityEnergyMap = {
    high: ["high"],
    medium: ["high", "medium"],
    low: ["high", "medium", "low"],
    urgent: ["high", "medium", "low"],
};
// Utility functions for time manipulation
function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}
/**
 * Validate a date is within the scheduling range
 */
function isDateInRange(date, range) {
    if (!range)
        return true;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const rangeStart = new Date(range.start);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(range.end);
    rangeEnd.setHours(23, 59, 59, 999);
    return startOfDay >= rangeStart && endOfDay <= rangeEnd;
}
// Time period management
function getTimePeriodRange(period, dailySchedule = DEFAULT_DAILY_SCHEDULE) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    switch (period.type) {
        case "today": {
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);
            return { start: today, end: endOfToday };
        }
        case "tomorrow": {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);
            return { start: tomorrow, end: endOfTomorrow };
        }
        case "this_week": {
            const allowedDays = dailySchedule.map((schedule) => schedule.day).sort();
            if (allowedDays.length === 0)
                return { start: today, end: today };
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            let startDate = new Date(today);
            while (!allowedDays.includes(startDate.getDay()) &&
                startDate <= endOfWeek) {
                startDate.setDate(startDate.getDate() + 1);
            }
            let endDate = new Date(endOfWeek);
            while (!allowedDays.includes(endDate.getDay()) && endDate >= today) {
                endDate.setDate(endDate.getDate() - 1);
            }
            if (startDate > endDate) {
                startDate = new Date(endOfWeek);
                startDate.setDate(startDate.getDate() + 1);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                while (!allowedDays.includes(startDate.getDay()) &&
                    startDate <= endDate) {
                    startDate.setDate(startDate.getDate() + 1);
                }
                while (!allowedDays.includes(endDate.getDay()) &&
                    endDate >= startDate) {
                    endDate.setDate(endDate.getDate() - 1);
                }
            }
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return { start: startDate, end: endDate };
        }
        case "custom": {
            if (!period.customRange) {
                throw new Error("Custom time period requires date range");
            }
            const customStart = new Date(period.customRange.start);
            customStart.setHours(0, 0, 0, 0);
            const customEnd = new Date(period.customRange.end);
            customEnd.setHours(23, 59, 59, 999);
            return { start: customStart, end: customEnd };
        }
    }
}
// Task scheduling constraints checking
function isTimeBlocked(date, blockedIntervals) {
    if (!(blockedIntervals === null || blockedIntervals === void 0 ? void 0 : blockedIntervals.length))
        return false;
    const timeStr = date.toTimeString().slice(0, 5);
    const minutes = timeToMinutes(timeStr);
    return blockedIntervals.some((interval) => {
        const intervalStart = timeToMinutes(interval.start);
        const intervalEnd = timeToMinutes(interval.end);
        return minutes >= intervalStart && minutes < intervalEnd;
    });
}
function isBreakTime(slot, options) {
    const timeStr = slot.toTimeString().slice(0, 5);
    if (!options.optimization.addBreaks.enabled)
        return false;
    if (options.optimization.addBreaks.lunchBreak) {
        const lunchStart = timeToMinutes(options.optimization.addBreaks.lunchBreak.start);
        const lunchEnd = lunchStart + options.optimization.addBreaks.lunchBreak.duration;
        const slotMinutes = timeToMinutes(timeStr);
        if (slotMinutes >= lunchStart && slotMinutes < lunchEnd) {
            return true;
        }
    }
    if (options.optimization.addBreaks.shortBreaks) {
        const { frequency, duration } = options.optimization.addBreaks.shortBreaks;
        const startOfDay = new Date(slot);
        startOfDay.setHours(9, 0, 0, 0);
        const minutesSinceStart = (slot.getTime() - startOfDay.getTime()) / 60000;
        if (minutesSinceStart % frequency < duration) {
            return true;
        }
    }
    return false;
}
// Helper for checking task overlap and break times
function hasTaskOverlap(task, existingTasks, breakMinutes) {
    if (!task.startTime || !task.endTime)
        return false;
    for (const existing of existingTasks) {
        if (!existing.startTime || !existing.endTime)
            continue;
        const taskStart = task.startTime.getTime();
        const taskEnd = task.endTime.getTime() + breakMinutes * 60000;
        const existingStart = existing.startTime.getTime();
        const existingEnd = existing.endTime.getTime() + breakMinutes * 60000;
        if ((taskStart >= existingStart && taskStart < existingEnd) ||
            (taskEnd > existingStart && taskEnd <= existingEnd) ||
            (taskStart <= existingStart && taskEnd >= existingEnd)) {
            return true;
        }
    }
    return false;
}
// Get daily task statistics for a specific date
function getDailyStats(date, tasks, options) {
    var _a;
    const stats = {
        taskCount: 0,
        totalDuration: 0,
        priorityCounts: {
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
        },
        totalMinutes: 0,
    };
    // Count tasks scheduled for this date
    for (const task of tasks) {
        if (((_a = task.startTime) === null || _a === void 0 ? void 0 : _a.toDateString()) === date.toDateString()) {
            stats.taskCount++;
            const duration = task.duration || options.defaultDuration;
            stats.totalDuration += duration;
            stats.totalMinutes += duration;
            stats.priorityCounts[task.priority]++;
        }
    }
    return stats;
}
// Core scheduling algorithm components
function findBestTimeSlot(task, date, existingTasks, options) {
    const daySchedule = options.dailySchedule.find((s) => s.day === date.getDay());
    if (!daySchedule)
        return null;
    const stats = getDailyStats(date, existingTasks, options);
    if (stats.taskCount >= options.maxTasksPerDay) {
        return null;
    }
    if (stats.priorityCounts[task.priority] >= options.priorityLimits[task.priority]) {
        return null;
    }
    if (stats.totalMinutes + (task.duration || options.defaultDuration) > options.maxHoursPerDay * 60) {
        return null;
    }
    const startMinutes = timeToMinutes(daySchedule.availableFrom);
    const endMinutes = timeToMinutes(daySchedule.availableTo);
    const taskDuration = task.duration || options.defaultDuration;
    let bestSlot = null;
    let bestScore = Infinity;
    for (let minutes = startMinutes; minutes <= endMinutes - taskDuration; minutes += options.timeSlotInterval) {
        const slot = new Date(date);
        slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        if (isTimeBlocked(slot, daySchedule.blockedIntervals) || isBreakTime(slot, options)) {
            continue;
        }
        const potentialTask = Object.assign(Object.assign({}, task), { startTime: new Date(slot), endTime: new Date(slot.getTime() + taskDuration * 60000) });
        if (hasTaskOverlap(potentialTask, existingTasks, options.breakBetweenTasks)) {
            continue;
        }
        const slotEnergy = getEnergyLevel(slot, options.energyLevels);
        if (!priorityEnergyMap[task.priority].includes(slotEnergy)) {
            continue;
        }
        const score = calculateSlotScore(slot, task, existingTasks, options);
        if (score < bestScore) {
            bestScore = score;
            bestSlot = slot;
        }
    }
    return bestSlot;
}
function calculateSlotScore(slot, task, existingTasks, options) {
    let score = 0;
    const stats = getDailyStats(slot, existingTasks, options);
    if (stats.taskCount > 0) {
        score -= 200;
    }
    const closestTask = existingTasks
        .filter((t) => { var _a; return ((_a = t.startTime) === null || _a === void 0 ? void 0 : _a.toDateString()) === slot.toDateString(); })
        .reduce((closest, t) => {
        if (!t.startTime)
            return closest;
        const distance = Math.abs(t.startTime.getTime() - slot.getTime());
        return distance < closest ? distance : closest;
    }, Infinity);
    if (closestTask !== Infinity) {
        score -= Math.min(100, Math.floor(100000 / closestTask));
    }
    const energy = getEnergyLevel(slot, options.energyLevels);
    if (task.priority === "urgent" || task.priority === "high") {
        score += energy === "high" ? 0 : 50;
    }
    if (options.optimization.optimizeFocusTime) {
        const adjacentTasks = existingTasks.filter((t) => t.category === task.category &&
            t.startTime &&
            Math.abs(t.startTime.getTime() - slot.getTime()) <= 60 * 60 * 1000);
        score -= adjacentTasks.length * 50;
    }
    const utilizationScore = (stats.totalMinutes / (options.maxHoursPerDay * 60)) * 100;
    score -= utilizationScore;
    return score;
}
function findAvailableDays(task, existingTasks, options, moodAdjustments) {
    const dateRange = options.dateRange ||
        getTimePeriodRange(options.timePeriod, options.dailySchedule);
    const availableDaysWithScores = [];
    let currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
        const daySchedule = options.dailySchedule.find((s) => s.day === currentDate.getDay());
        if (daySchedule) {
            const dateKey = currentDate.toISOString().split("T")[0];
            const moodFactor = options.considerMood && moodAdjustments && moodAdjustments[dateKey]
                ? moodAdjustments[dateKey]
                : 1.0;
            const stats = getDailyStats(currentDate, existingTasks, options);
            const adjustedMaxTasks = Math.round(options.maxTasksPerDay * moodFactor);
            const adjustedPriorityLimit = Math.round(options.priorityLimits[task.priority] * moodFactor);
            const adjustedMaxMinutes = Math.round(options.maxHoursPerDay * 60 * moodFactor);
            if (stats.taskCount < adjustedMaxTasks &&
                stats.priorityCounts[task.priority] < adjustedPriorityLimit &&
                stats.totalMinutes + (task.duration || options.defaultDuration) <=
                    adjustedMaxMinutes) {
                const score = getDayScore(currentDate, task, existingTasks, options, moodFactor);
                availableDaysWithScores.push({
                    date: new Date(currentDate),
                    score,
                });
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return availableDaysWithScores
        .sort((a, b) => b.score - a.score)
        .map((item) => item.date);
}
function getDayScore(date, task, existingTasks, options, moodFactor = 1.0) {
    const stats = getDailyStats(date, existingTasks, options);
    let score = 0;
    if (stats.taskCount > 0) {
        score += 1000 - stats.taskCount * 100;
    }
    const similarTasks = existingTasks.filter((t) => {
        var _a;
        return ((_a = t.startTime) === null || _a === void 0 ? void 0 : _a.toDateString()) === date.toDateString() &&
            t.category === task.category;
    }).length;
    if (similarTasks > 0) {
        score += similarTasks * 200;
    }
    const utilization = stats.totalMinutes / (options.maxHoursPerDay * 60);
    if (utilization > 0) {
        score += Math.floor((1 - Math.abs(0.5 - utilization)) * 500);
    }
    if (options.considerMood && moodFactor !== 1.0) {
        const priorityFactor = priorityMap[task.priority] / Object.keys(priorityMap).length;
        const moodImpact = 1 - priorityFactor * (1 - moodFactor);
        score *= moodImpact;
        score += (moodFactor - 0.5) * 1000;
    }
    return score;
}
function scheduleTask(task, existingTasks, options) {
    const availableDays = findAvailableDays(task, existingTasks, options, options.moodAdjustments);
    if (availableDays.length === 0)
        return null;
    let bestSlot = null;
    let bestDate = null;
    let bestScore = Infinity;
    if (task.date) {
        const prefDateStr = task.date.toDateString();
        const availablePrefDay = availableDays.find((d) => d.toDateString() === prefDateStr);
        if (availablePrefDay) {
            const slot = findBestTimeSlot(task, availablePrefDay, existingTasks, options);
            if (slot) {
                bestSlot = slot;
                bestDate = availablePrefDay;
                bestScore = -Infinity;
            }
        }
    }
    if (!bestSlot) {
        for (const date of availableDays) {
            const slot = findBestTimeSlot(task, date, existingTasks, options);
            if (slot) {
                const score = calculateSlotScore(slot, task, existingTasks, options);
                if (score < bestScore) {
                    bestScore = score;
                    bestSlot = slot;
                    bestDate = date;
                }
            }
        }
    }
    if (bestSlot && bestDate) {
        return Object.assign(Object.assign({}, task), { date: bestDate, startTime: bestSlot, endTime: new Date(bestSlot.getTime() + (task.duration || options.defaultDuration) * 60000), scheduled: true });
    }
    return null;
}
function getEnergyLevel(time, energyLevels = DEFAULT_OPTIONS.energyLevels) {
    const timeStr = time.toTimeString().slice(0, 5);
    if (energyLevels.highEnergyHours.includes(timeStr))
        return "high";
    if (energyLevels.mediumEnergyHours.includes(timeStr))
        return "medium";
    return "low";
}
// Helper to get task score for sorting
function getTaskScore(task, options) {
    let score = priorityMap[task.priority] * 1000;
    if (task.date)
        score -= 100;
    score += task.duration || options.defaultDuration;
    return score;
}
// Update the scheduleTasks function to preserve urgent scheduled tasks
function scheduleTasks(tasks, options = {}) {
    var _a;
    const finalOptions = Object.assign(Object.assign(Object.assign({}, DEFAULT_OPTIONS), options), { optimization: Object.assign(Object.assign(Object.assign({}, DEFAULT_OPTIONS.optimization), (options.optimization || {})), { addBreaks: Object.assign(Object.assign({}, DEFAULT_OPTIONS.optimization.addBreaks), (((_a = options.optimization) === null || _a === void 0 ? void 0 : _a.addBreaks) || {})) }), dailySchedule: options.dailySchedule || DEFAULT_OPTIONS.dailySchedule, considerMood: options.considerMood !== undefined ? options.considerMood : false });
    if (!finalOptions.dateRange && finalOptions.timePeriod) {
        finalOptions.dateRange = getTimePeriodRange(finalOptions.timePeriod, finalOptions.dailySchedule);
    }
    const urgentScheduledTasks = tasks.filter((task) => task.priority === "urgent" &&
        task.scheduled &&
        task.startTime &&
        task.endTime);
    const relevantUrgentTasks = urgentScheduledTasks.filter((task) => !finalOptions.dateRange ||
        isDateInRange(task.startTime, finalOptions.dateRange));
    const otherScheduledTasks = tasks.filter((task) => !(task.priority === "urgent" && task.scheduled) &&
        task.scheduled &&
        task.startTime &&
        task.endTime &&
        (!finalOptions.dateRange ||
            isDateInRange(task.startTime, finalOptions.dateRange)));
    const scheduledTasks = [...relevantUrgentTasks];
    switch (finalOptions.taskSelectionMode) {
        case "unscheduled": {
            scheduledTasks.push(...otherScheduledTasks);
            const unscheduledTasks = tasks
                .filter((task) => !task.scheduled)
                .sort((a, b) => getTaskScore(a, finalOptions) - getTaskScore(b, finalOptions));
            for (const task of unscheduledTasks) {
                const scheduledTask = scheduleTask(task, scheduledTasks, finalOptions);
                if (scheduledTask) {
                    scheduledTasks.push(scheduledTask);
                }
            }
            break;
        }
        case "reschedule": {
            const tasksToReschedule = otherScheduledTasks
                .sort((a, b) => getTaskScore(a, finalOptions) - getTaskScore(b, finalOptions))
                .map((task) => (Object.assign(Object.assign({}, task), { scheduled: false, startTime: undefined, endTime: undefined })));
            for (const task of tasksToReschedule) {
                const scheduledTask = scheduleTask(task, scheduledTasks, finalOptions);
                if (scheduledTask) {
                    scheduledTasks.push(scheduledTask);
                }
            }
            break;
        }
        case "full":
        default: {
            const tasksToSchedule = tasks
                .filter((task) => !(task.priority === "urgent" &&
                task.scheduled &&
                task.startTime &&
                task.endTime) ||
                (task.startTime &&
                    !isDateInRange(task.startTime, finalOptions.dateRange)))
                .sort((a, b) => getTaskScore(a, finalOptions) - getTaskScore(b, finalOptions))
                .map((task) => (Object.assign(Object.assign({}, task), { scheduled: false, startTime: undefined, endTime: undefined })));
            for (const task of tasksToSchedule) {
                const scheduledTask = scheduleTask(task, scheduledTasks, finalOptions);
                if (scheduledTask) {
                    scheduledTasks.push(scheduledTask);
                }
            }
            break;
        }
    }
    return scheduledTasks;
}
