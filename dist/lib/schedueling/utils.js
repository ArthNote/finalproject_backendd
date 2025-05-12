"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchedule = validateSchedule;
exports.isWithinWorkingHours = isWithinWorkingHours;
exports.formatSchedule = formatSchedule;
exports.getScheduleStats = getScheduleStats;
function validateSchedule(tasks, options) {
    const errors = [];
    // Sort tasks by start time for easier validation
    const sortedTasks = [...tasks].sort((a, b) => {
        var _a, _b, _c, _d;
        const timeA = (_b = (_a = a.startTime) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : 0;
        const timeB = (_d = (_c = b.startTime) === null || _c === void 0 ? void 0 : _c.getTime()) !== null && _d !== void 0 ? _d : 0;
        return timeA - timeB;
    });
    // Check for overlapping tasks
    for (let i = 0; i < sortedTasks.length - 1; i++) {
        const current = sortedTasks[i];
        const next = sortedTasks[i + 1];
        if (!current.startTime ||
            !current.endTime ||
            !next.startTime ||
            !next.endTime) {
            errors.push(`Task ${current.title} or ${next.title} has missing start/end times`);
            continue;
        }
        if (current.endTime > next.startTime) {
            errors.push(`Task overlap detected between "${current.title}" and "${next.title}" ` +
                `at ${current.endTime.toLocaleString()}`);
        }
    }
    // Process each task for various validations
    for (const task of tasks) {
        if (!task.startTime || !task.endTime)
            continue;
        // Validate working hours (9 AM - 5 PM)
        const startHour = task.startTime.getHours();
        const endHour = task.endTime.getHours();
        const endMinute = task.endTime.getMinutes();
        if (startHour < 9 ||
            startHour > 17 ||
            endHour < 9 ||
            (endHour === 17 && endMinute > 0) ||
            endHour > 17) {
            errors.push(`Task "${task.title}" scheduled outside working hours ` +
                `(${task.startTime.toLocaleString()} - ${task.endTime.toLocaleString()})`);
        }
        // Check break time between tasks
        const breakMinutes = options === null || options === void 0 ? void 0 : options.breakBetweenTasks;
        if (breakMinutes && task.startTime && task.endTime) {
            const breakViolation = tasks.some((otherTask) => {
                if (otherTask === task || !otherTask.startTime || !otherTask.endTime)
                    return false;
                // Calculate time difference in minutes
                const taskStart = task.startTime.getTime();
                const taskEnd = task.endTime.getTime();
                const otherStart = otherTask.startTime.getTime();
                const otherEnd = otherTask.endTime.getTime();
                const timeDiff1 = Math.abs((taskStart - otherEnd) / 60000);
                const timeDiff2 = Math.abs((otherStart - taskEnd) / 60000);
                // Check if any gap is smaller than required break
                return ((timeDiff1 > 0 && timeDiff1 < breakMinutes) ||
                    (timeDiff2 > 0 && timeDiff2 < breakMinutes));
            });
            if (breakViolation) {
                errors.push(`Task "${task.title}" does not maintain minimum break time of ${breakMinutes} minutes`);
            }
        }
        // Validate date range if specified
        if (options) {
            const startOfDay = new Date(options.start);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(options.end);
            endOfDay.setHours(23, 59, 59, 999);
            if (task.startTime < startOfDay || task.endTime > endOfDay) {
                errors.push(`Task "${task.title}" scheduled outside specified date range ` +
                    `(${options.start.toLocaleDateString()} - ${options.end.toLocaleDateString()})`);
            }
        }
        // Validate task duration
        if (task.duration) {
            const actualDuration = (task.endTime.getTime() - task.startTime.getTime()) / 60000;
            if (Math.abs(actualDuration - task.duration) > 1) {
                // Allow 1 minute tolerance
                errors.push(`Task "${task.title}" scheduled duration (${Math.round(actualDuration)}min) ` + `doesn't match specified duration (${task.duration}min)`);
            }
        }
        // Validate weekends
        const day = task.startTime.getDay();
        if (day === 0 || day === 6) {
            errors.push(`Task "${task.title}" scheduled on weekend ` +
                `(${task.startTime.toLocaleDateString()})`);
        }
    }
    return errors;
}
/**
 * Check if a time slot is within working hours (9 AM - 5 PM)
 */
function isWithinWorkingHours(date) {
    const hour = date.getHours();
    return hour >= 9 && hour <= 17;
}
/**
 * Format a schedule for display
 */
function formatSchedule(tasks) {
    const sortedTasks = [...tasks].sort((a, b) => {
        var _a, _b, _c, _d;
        const timeA = (_b = (_a = a.startTime) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : 0;
        const timeB = (_d = (_c = b.startTime) === null || _c === void 0 ? void 0 : _c.getTime()) !== null && _d !== void 0 ? _d : 0;
        return timeA - timeB;
    });
    let output = "Schedule:\n";
    let currentDate = "";
    for (const task of sortedTasks) {
        if (!task.startTime || !task.endTime)
            continue;
        const dateStr = task.startTime.toLocaleDateString();
        if (dateStr !== currentDate) {
            currentDate = dateStr;
            output += `\n${currentDate}\n${"-".repeat(20)}\n`;
        }
        output +=
            `${task.startTime.toLocaleTimeString()} - ${task.endTime.toLocaleTimeString()}: ` +
                `${task.title} (${task.priority} priority)\n`;
    }
    return output;
}
/**
 * Calculate schedule statistics
 */
function getScheduleStats(tasks) {
    const stats = {
        totalTasks: tasks.length,
        tasksPerDay: {},
        priorityDistribution: {
            high: 0,
            medium: 0,
            low: 0,
            urgent: 0,
        },
        averageTaskDuration: 0,
    };
    let totalDuration = 0;
    for (const task of tasks) {
        if (task.startTime) {
            const dateStr = task.startTime.toLocaleDateString();
            stats.tasksPerDay[dateStr] = (stats.tasksPerDay[dateStr] || 0) + 1;
        }
        stats.priorityDistribution[task.priority]++;
        if (task.duration) {
            totalDuration += task.duration;
        }
    }
    stats.averageTaskDuration = totalDuration / tasks.length;
    return stats;
}
