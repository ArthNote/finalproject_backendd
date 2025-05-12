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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManualTask = createManualTask;
exports.saveTasksList = saveTasksList;
exports.generateTasksWithAi = generateTasksWithAi;
exports.getTasks = getTasks;
exports.deleteTask = deleteTask;
exports.updateTask = updateTask;
exports.updateTaskPriority = updateTaskPriority;
exports.updateTaskCompleteStatus = updateTaskCompleteStatus;
exports.updateTaskStatus = updateTaskStatus;
exports.updateTaskKanban = updateTaskKanban;
exports.getTasksByDate = getTasksByDate;
exports.updateTaskTimes = updateTaskTimes;
exports.getCalendarTasks = getCalendarTasks;
exports.getAllTasks = getAllTasks;
exports.getTodayTasks = getTodayTasks;
exports.getTaskAnalytics = getTaskAnalytics;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const gemini_1 = require("../lib/gemini");
const gameprogress_1 = require("../lib/gameprogress");
function createManualTask(req, res) {
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
            const task = req.body;
            if (!task) {
                return res.status(400).json({
                    message: "No task data provided",
                    success: false,
                });
            }
            const { id, parentId, resources, assignedTo, projectId, teamId } = task, taskData = __rest(task, ["id", "parentId", "resources", "assignedTo", "projectId", "teamId"]);
            yield prisma_1.db.task.create({
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, taskData), { user: { connect: { id: session.user.id } } }), (projectId ? { project: { connect: { id: projectId } } } : {})), (parentId ? { parent: { connect: { id: parentId } } } : {})), (teamId ? { team: { connect: { id: teamId } } } : {})), (assignedTo && assignedTo.length > 0
                    ? {
                        assignedTo: {
                            create: assignedTo.map((userId) => ({
                                user: {
                                    connect: {
                                        id: typeof userId === "object" ? userId.id : userId,
                                    },
                                },
                            })),
                        },
                    }
                    : {})), (resources && resources.length > 0
                    ? {
                        resources: {
                            create: resources.map((_a) => {
                                var { id } = _a, resource = __rest(_a, ["id"]);
                                return (Object.assign({}, resource));
                            }),
                        },
                    }
                    : {})),
            });
            if (teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: teamId,
                        action: "created",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task created successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error creating task:", error);
            return res.status(400).json({
                message: "Error creating task: " + error,
                success: false,
            });
        }
    });
}
function saveTasksList(req, res) {
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
            const tasks = req.body;
            if (!tasks) {
                return res.status(400).json({
                    message: "No tasks data provided",
                    success: false,
                });
            }
            // Create tasks in the database
            yield Promise.all(tasks.map((task) => __awaiter(this, void 0, void 0, function* () {
                const { id, parentId, resources, assignedTo, teamId, projectId } = task, taskData = __rest(task, ["id", "parentId", "resources", "assignedTo", "teamId", "projectId"]);
                // Ensure date fields are properly formatted as Date objects
                const formattedTaskData = Object.assign(Object.assign({}, taskData), { 
                    // Convert date string to Date object or keep null
                    date: taskData.date ? new Date(taskData.date) : null, 
                    // Convert startTime string to Date object or keep null
                    startTime: taskData.startTime ? new Date(taskData.startTime) : null, 
                    // Convert endTime string to Date object or keep null
                    endTime: taskData.endTime ? new Date(taskData.endTime) : null });
                yield prisma_1.db.task.create({
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, formattedTaskData), { teamId: task.teamId, userId: session.user.id }), (teamId && {
                        teamId: teamId, // Use direct ID assignment instead of connect
                    })), (projectId && {
                        projectId: projectId, // Use direct ID assignment instead of connect
                    })), (parentId && {
                        parentId: parentId, // Use direct ID assignment instead of connect
                    })), (assignedTo && assignedTo.length > 0
                        ? {
                            assignedTo: {
                                create: assignedTo.map((userId) => ({
                                    userId: typeof userId === "object" ? userId.id : userId,
                                })),
                            },
                        }
                        : {})),
                });
            })));
            return res.status(200).json({
                message: "Tasks created successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error creating tasks:", error);
            return res.status(400).json({
                message: "Error creating tasks: " + error,
                success: false,
            });
        }
    });
}
function generateTasksWithAi(req, res) {
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
            const { date, prompt } = req.body;
            if (!prompt || !date) {
                return res.status(400).json({
                    message: "No prompt or date provided",
                    success: false,
                });
            }
            // Generate tasks using AI
            const tasksString = yield (0, gemini_1.generateTasks)(prompt, date);
            if (!tasksString) {
                return res.status(400).json({
                    message: "No tasks generated",
                    success: false,
                });
            }
            // Parse the generated tasks string into an array of TaskType objects
            const tasks = JSON.parse(tasksString);
            if (!Array.isArray(tasks)) {
                return res.status(400).json({
                    message: "Invalid tasks format",
                    success: false,
                });
            }
            return res.status(200).json({
                message: "Tasks created successfully",
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            console.error("Error creating task:", error);
            return res.status(400).json({
                message: "Error creating task: " + error,
                success: false,
            });
        }
    });
}
function getTasks(req, res) {
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
            const { search, category, scheduled, priority, dateFrom, dateTo, todoPage = 1, todoLimit = 2, completedPage = 1, completedLimit = 2, unscheduledPage = 1, unscheduledLimit = 2, inprogressPage = 1, inprogressLimit = 2, } = req.query;
            // Base query conditions - include tasks where user is either owner or assigned
            const baseWhere = {
                OR: [
                    { userId: session.user.id }, // Tasks created by the user
                    {
                        assignedTo: {
                            some: {
                                userId: session.user.id, // Tasks assigned to the user
                            },
                        },
                    },
                ],
            };
            // Apply search filter if provided - we'll handle this separately for each section
            let searchCondition = null;
            if (search) {
                searchCondition = {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                };
            }
            // Apply category filter if provided - we'll handle this separately for each section
            let categoryCondition = null;
            if (category && category !== "all") {
                categoryCondition = { category: category };
            }
            // Apply priority filter if provided - we'll handle this separately for each section
            let priorityCondition = null;
            if (priority && priority !== "all") {
                priorityCondition = { priority: priority };
            }
            // Combine all filters for each section separately
            // 1. TODO TASKS - scheduled and not completed
            const todoWhere = Object.assign(Object.assign({}, baseWhere), { completed: false, scheduled: true });
            // Add search, category and priority filters to todo tasks
            if (searchCondition) {
                todoWhere.AND = todoWhere.AND || [];
                todoWhere.AND.push(searchCondition);
            }
            if (categoryCondition) {
                todoWhere.AND = todoWhere.AND || [];
                todoWhere.AND.push(categoryCondition);
            }
            if (priorityCondition) {
                todoWhere.AND = todoWhere.AND || [];
                todoWhere.AND.push(priorityCondition);
            }
            // Add date filter for scheduled tasks
            if (dateFrom || dateTo) {
                todoWhere.AND = todoWhere.AND || [];
                if (dateFrom) {
                    todoWhere.AND.push({ date: { gte: new Date(dateFrom) } });
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    todoWhere.AND.push({ date: { lte: endDate } });
                }
            }
            // 2. COMPLETED TASKS
            const completedWhere = Object.assign(Object.assign({}, baseWhere), { completed: true });
            // Add search, category and priority filters to completed tasks
            if (searchCondition) {
                completedWhere.AND = completedWhere.AND || [];
                completedWhere.AND.push(searchCondition);
            }
            if (categoryCondition) {
                completedWhere.AND = completedWhere.AND || [];
                completedWhere.AND.push(categoryCondition);
            }
            if (priorityCondition) {
                completedWhere.AND = completedWhere.AND || [];
                completedWhere.AND.push(priorityCondition);
            }
            // Add date filter for completed tasks
            if (dateFrom || dateTo) {
                completedWhere.AND = completedWhere.AND || [];
                if (dateFrom) {
                    completedWhere.AND.push({
                        date: { gte: new Date(dateFrom) },
                    });
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    completedWhere.AND.push({ date: { lte: endDate } });
                }
            }
            // 3. UNSCHEDULED TASKS
            const unscheduledWhere = Object.assign(Object.assign({}, baseWhere), { completed: false, scheduled: false });
            // Add search, category and priority filters to unscheduled tasks
            if (searchCondition) {
                unscheduledWhere.AND = unscheduledWhere.AND || [];
                unscheduledWhere.AND.push(searchCondition);
            }
            if (categoryCondition) {
                unscheduledWhere.AND = unscheduledWhere.AND || [];
                unscheduledWhere.AND.push(categoryCondition);
            }
            if (priorityCondition) {
                unscheduledWhere.AND = unscheduledWhere.AND || [];
                unscheduledWhere.AND.push(priorityCondition);
            }
            // For unscheduled tasks, allow null dates but also apply date filters to any that have dates
            if ((dateFrom || dateTo) &&
                (scheduled === "all" || scheduled === "unscheduled")) {
                unscheduledWhere.AND = unscheduledWhere.AND || [];
                // For date filters on unscheduled tasks, we want to include tasks with null dates
                // OR tasks with dates matching the filter
                const dateCondition = {
                    OR: [
                        { date: null }, // Always include tasks with null dates for unscheduled section
                    ],
                };
                // Build the date range condition for non-null dates
                let dateRangeCondition = {};
                if (dateFrom && dateTo) {
                    const startDate = new Date(dateFrom);
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    dateRangeCondition = {
                        AND: [{ date: { gte: startDate } }, { date: { lte: endDate } }],
                    };
                    dateCondition.OR.push(dateRangeCondition);
                }
                else if (dateFrom) {
                    dateCondition.OR.push({ date: { gte: new Date(dateFrom) } });
                }
                else if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    dateCondition.OR.push({ date: { lte: endDate } });
                }
                unscheduledWhere.AND.push(dateCondition);
            }
            // Add a new section for IN PROGRESS TASKS
            const inprogressWhere = Object.assign(Object.assign({}, baseWhere), { completed: false, scheduled: true, status: "inprogress" });
            // Add search, category and priority filters to in-progress tasks
            if (searchCondition) {
                inprogressWhere.AND = inprogressWhere.AND || [];
                inprogressWhere.AND.push(searchCondition);
            }
            if (categoryCondition) {
                inprogressWhere.AND = inprogressWhere.AND || [];
                inprogressWhere.AND.push(categoryCondition);
            }
            if (priorityCondition) {
                inprogressWhere.AND = inprogressWhere.AND || [];
                inprogressWhere.AND.push(priorityCondition);
            }
            // Add date filter for in-progress tasks
            if (dateFrom || dateTo) {
                inprogressWhere.AND = inprogressWhere.AND || [];
                if (dateFrom) {
                    inprogressWhere.AND.push({
                        date: { gte: new Date(dateFrom) },
                    });
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    inprogressWhere.AND.push({ date: { lte: endDate } });
                }
            }
            // Modify todoWhere to exclude in-progress tasks
            todoWhere.AND = todoWhere.AND || [];
            todoWhere.AND.push({
                OR: [{ status: null }, { status: { not: "inprogress" } }],
            });
            // Calculate proper offsets for pagination
            const todoSkip = (Number(todoPage) - 1) * Number(todoLimit);
            const completedSkip = (Number(completedPage) - 1) * Number(completedLimit);
            const unscheduledSkip = (Number(unscheduledPage) - 1) * Number(unscheduledLimit);
            const inprogressSkip = (Number(inprogressPage) - 1) * Number(inprogressLimit);
            // Execute queries in parallel
            const [todoTasks, todoTotal, completedTasks, completedTotal, unscheduledTasks, unscheduledTotal, inprogressTasks, inprogressTotal,] = yield Promise.all([
                scheduled !== "unscheduled"
                    ? prisma_1.db.task.findMany({
                        where: todoWhere,
                        skip: todoSkip,
                        take: Number(todoLimit),
                        orderBy: { order: "asc" },
                        include: {
                            resources: true,
                            assignedTo: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            image: true,
                                        },
                                    },
                                },
                            },
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    ownerId: true,
                                },
                            },
                        },
                    })
                    : Promise.resolve([]),
                scheduled !== "unscheduled"
                    ? prisma_1.db.task.count({ where: todoWhere })
                    : Promise.resolve(0),
                // Completed tasks
                prisma_1.db.task.findMany({
                    where: completedWhere,
                    skip: completedSkip,
                    take: Number(completedLimit),
                    orderBy: { order: "asc" },
                    include: {
                        resources: true,
                        assignedTo: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                        project: {
                            select: {
                                id: true,
                                name: true,
                                ownerId: true,
                            },
                        },
                    },
                }),
                // Completed tasks count
                prisma_1.db.task.count({ where: completedWhere }),
                // Unscheduled tasks - only get if filter is "all" or "unscheduled"
                scheduled !== "scheduled"
                    ? prisma_1.db.task.findMany({
                        where: unscheduledWhere,
                        skip: unscheduledSkip,
                        take: Number(unscheduledLimit),
                        orderBy: { order: "asc" },
                        include: {
                            resources: true,
                            assignedTo: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            image: true,
                                        },
                                    },
                                },
                            },
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    ownerId: true,
                                },
                            },
                        },
                    })
                    : Promise.resolve([]),
                // Unscheduled tasks count
                scheduled !== "scheduled"
                    ? prisma_1.db.task.count({ where: unscheduledWhere })
                    : Promise.resolve(0),
                // In-progress tasks
                scheduled !== "unscheduled"
                    ? prisma_1.db.task.findMany({
                        where: inprogressWhere,
                        skip: inprogressSkip,
                        take: Number(inprogressLimit),
                        orderBy: { order: "asc" },
                        include: {
                            resources: true,
                            assignedTo: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            image: true,
                                        },
                                    },
                                },
                            },
                            project: {
                                select: {
                                    id: true,
                                    name: true,
                                    ownerId: true,
                                },
                            },
                        },
                    })
                    : Promise.resolve([]),
                // In-progress tasks count
                scheduled !== "unscheduled"
                    ? prisma_1.db.task.count({ where: inprogressWhere })
                    : Promise.resolve(0),
            ]);
            // Transform user data to match our AssignedUser interface
            const transformTaskAssignees = (tasks) => {
                return tasks.map((task) => {
                    var _a;
                    return (Object.assign(Object.assign({}, task), { assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => ({
                            id: assignment.user.id,
                            name: assignment.user.name,
                            profilePic: assignment.user.image,
                        }))) || [] }));
                });
            };
            const todo = transformTaskAssignees(todoTasks);
            const completed = transformTaskAssignees(completedTasks);
            const unscheduled = transformTaskAssignees(unscheduledTasks);
            const inprogress = transformTaskAssignees(inprogressTasks);
            return res.status(200).json({
                todo,
                todoTotal,
                completed,
                completedTotal,
                unscheduled,
                unscheduledTotal,
                inprogress,
                inprogressTotal,
            });
        }
        catch (error) {
            console.error("Error fetching tasks:", error);
            return res.status(500).json({
                message: "Error fetching tasks: " + error,
                success: false,
            });
        }
    });
}
function deleteTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const task = yield prisma_1.db.task.findUnique({
                where: {
                    id: id,
                    userId: session.user.id,
                },
            });
            if (!task) {
                return res.status(404).send({
                    message: "Task not found",
                    success: false,
                });
            }
            const teamId = task.teamId;
            yield prisma_1.db.task.delete({
                where: {
                    id: id,
                },
            });
            if (teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: teamId,
                        action: "deleted",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task deleted",
                success: true,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error deleting task: " + error,
                success: false,
            });
        }
    });
}
function updateTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const taskData = req.body;
            if (!taskData) {
                return res.status(400).json({
                    message: "No task data provided",
                    success: false,
                });
            }
            // Check if the task exists and belongs to the user
            const existingTask = yield prisma_1.db.task.findFirst({
                where: {
                    id: id,
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                },
                include: {
                    assignedTo: true,
                    resources: true,
                },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found",
                    success: false,
                });
            }
            // Extract the fields that need special handling
            const { projectId, assignedTo, resources, parentId, id: taskId } = taskData, updateData = __rest(taskData, ["projectId", "assignedTo", "resources", "parentId", "id"]);
            // Prepare the update data
            const updateObject = Object.assign({}, updateData);
            // Handle parent task connection/disconnection
            if (parentId !== undefined) {
                if (parentId) {
                    updateObject.parent = { connect: { id: parentId } };
                }
                else {
                    // Handle null or empty string parentId - disconnect the relationship
                    updateObject.parent = { disconnect: true };
                }
            }
            // Update the task
            yield prisma_1.db.task.update({
                where: { id },
                data: Object.assign(Object.assign({}, updateData), { teamId: updateData.teamId || null, projectId: projectId || null, parentId: parentId || null }),
            });
            // Handle resources if provided (delete existing and create new ones)
            if (resources) {
                // Delete existing resources
                yield prisma_1.db.taskResource.deleteMany({
                    where: { taskId: id },
                });
                // Create new resources
                if (resources.length > 0) {
                    yield prisma_1.db.taskResource.createMany({
                        data: resources.map((_a) => {
                            var { id: resourceId } = _a, resource = __rest(_a, ["id"]);
                            return (Object.assign(Object.assign({}, resource), { taskId: id }));
                        }),
                    });
                }
            }
            // Handle assigned users if provided
            if (assignedTo) {
                // Delete existing assignments
                yield prisma_1.db.taskAssignment.deleteMany({
                    where: { taskId: id },
                });
                // Create new assignments
                if (assignedTo.length > 0) {
                    yield prisma_1.db.taskAssignment.createMany({
                        data: assignedTo.map((user) => ({
                            taskId: id,
                            userId: typeof user === "object" ? user.id : user,
                        })),
                    });
                }
            }
            if (existingTask.teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: existingTask.teamId,
                        action: "updated",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task:", error);
            return res.status(500).json({
                message: "Error updating task: " + error,
                success: false,
            });
        }
    });
}
function updateTaskPriority(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const { priority } = req.body;
            if (!priority) {
                return res.status(400).json({
                    message: "No priority value provided",
                    success: false,
                });
            }
            // Check if the task exists and belongs to the user or is assigned to the user
            const existingTask = yield prisma_1.db.task.findFirst({
                where: {
                    id: id,
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found",
                    success: false,
                });
            }
            // Update only the priority field
            yield prisma_1.db.task.update({
                where: { id },
                data: {
                    priority: priority,
                },
            });
            if (existingTask.teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: existingTask.teamId,
                        action: "updated",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task priority updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task priority:", error);
            return res.status(500).json({
                message: "Error updating task priority: " + error,
                success: false,
            });
        }
    });
}
function updateTaskCompleteStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const existingTask = yield prisma_1.db.task.findFirst({
                where: {
                    id: id,
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found",
                    success: false,
                });
            }
            const isNowCompleted = !existingTask.completed;
            // Update task completion status
            yield prisma_1.db.task.update({
                where: { id },
                data: {
                    completed: isNowCompleted,
                },
            });
            if (isNowCompleted) {
                // Get user's active goals
                const userProgress = yield prisma_1.db.userProgress.findUnique({
                    where: { userId: session.user.id },
                    include: {
                        goals: {
                            where: {
                                status: "in-progress",
                            },
                        },
                    },
                });
                if (userProgress && userProgress.goals) {
                    // Update all task completion goals (daily, weekly, monthly)
                    const taskGoals = userProgress.goals.filter((goal) => {
                        var _a, _b;
                        return (goal.title.toLowerCase().includes("complete") &&
                            goal.title.toLowerCase().includes("task")) ||
                            (((_a = goal.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("complete")) &&
                                ((_b = goal.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("task")));
                    });
                    for (const goal of taskGoals) {
                        const currentProgress = goal.progress || 0;
                        let progressIncrement;
                        // Adjust progress increment based on goal type
                        switch (goal.type) {
                            case "DAILY":
                                progressIncrement = 20; // 5 tasks = 100%
                                break;
                            case "WEEKLY":
                                progressIncrement = 5; // 20 tasks = 100%
                                break;
                            case "MONTHLY":
                                progressIncrement = 1; // 100 tasks = 100%
                                break;
                            default:
                                progressIncrement = 0;
                        }
                        const newProgress = Math.min(currentProgress + progressIncrement, 100);
                        yield prisma_1.db.goal.update({
                            where: { id: goal.id },
                            data: {
                                progress: newProgress,
                                status: newProgress >= 100 ? "completed" : "in-progress",
                                completedAt: newProgress >= 100 ? new Date() : null,
                            },
                        });
                        // Award XP if goal is completed
                        if (newProgress >= 100 && currentProgress < 100) {
                            const gameProgress = new gameprogress_1.GameProgress();
                            yield gameProgress.awardGoalCompletionXP(session.user.id, goal.xpReward);
                        }
                    }
                }
                // Award XP for task completion
                const gameProgress = new gameprogress_1.GameProgress();
                yield gameProgress.awardTaskCompletionXP(session.user.id);
            }
            if (existingTask.teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: existingTask.teamId,
                        action: "updated",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task complete status updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task complete status:", error);
            return res.status(500).json({
                message: "Error updating task complete status: " + error,
                success: false,
            });
        }
    });
}
function updateTaskStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const status = req.body.status;
            if (!id) {
                return res.status(400).json({
                    message: "No id value provided",
                    success: false,
                });
            }
            if (!status) {
                return res.status(400).json({
                    message: "No status value provided",
                    success: false,
                });
            }
            // Check if the task exists and belongs to the user or is assigned to the user
            const existingTask = yield prisma_1.db.task.findFirst({
                where: {
                    id: id,
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found",
                    success: false,
                });
            }
            const isCompleted = status === "completed";
            const isUnscheduled = status === "unscheduled";
            // Update only the priority field
            yield prisma_1.db.task.update({
                where: { id },
                data: {
                    completed: isCompleted,
                    status: isCompleted ? existingTask.status : status,
                    scheduled: !isUnscheduled,
                    date: isUnscheduled ? null : existingTask.date,
                    startTime: isUnscheduled ? null : existingTask.startTime,
                    endTime: isUnscheduled ? null : existingTask.endTime,
                    duration: isUnscheduled ? null : existingTask.duration,
                },
            });
            if (existingTask.teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: existingTask.teamId,
                        action: "updated",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task status updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task status:", error);
            return res.status(500).json({
                message: "Error updating task status: " + error,
                success: false,
            });
        }
    });
}
function updateTaskKanban(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            // Get destinationIndex and status from body
            const { status, destinationIndex } = req.body;
            if (!id || !status || destinationIndex === undefined) {
                return res.status(400).json({
                    message: "Missing required fields: id, status, destinationIndex",
                    success: false,
                });
            }
            // Get the existing task
            const existingTask = yield prisma_1.db.task.findFirst({
                where: {
                    id: id,
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found or you don't have permission",
                    success: false,
                });
            }
            const isCompleted = status === "completed";
            const isUnscheduled = status === "unscheduled";
            // Start a transaction to ensure all updates are atomic
            yield prisma_1.db.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                // 1. Fetch tasks in the destination column, ordered correctly
                const destTasks = yield prisma.task.findMany({
                    where: {
                        // Filter by user AND the destination status
                        userId: session.user.id, // Assuming tasks belong to a user
                        status: status,
                        completed: isCompleted, // Ensure completed status matches
                        scheduled: !isUnscheduled, // Ensure scheduled status matches
                        id: { not: id }, // Exclude the task being moved
                    },
                    orderBy: {
                        order: "asc", // Order by the existing order field
                    },
                    select: {
                        order: true, // Only select the order field
                    },
                });
                // 2. Calculate the new order value
                let newOrder;
                const defaultOrderGap = 1000; // Gap between tasks, adjust as needed
                if (destTasks.length === 0) {
                    // If destination column is empty
                    newOrder = defaultOrderGap;
                }
                else if (destinationIndex === 0) {
                    // If moving to the beginning
                    const firstOrder = (_a = destTasks[0].order) !== null && _a !== void 0 ? _a : defaultOrderGap;
                    newOrder = firstOrder / 2;
                }
                else if (destinationIndex >= destTasks.length) {
                    // If moving to the end
                    const lastOrder = (_b = destTasks[destTasks.length - 1].order) !== null && _b !== void 0 ? _b : 0;
                    newOrder = lastOrder + defaultOrderGap;
                }
                else {
                    // If moving between two tasks
                    const prevOrder = (_c = destTasks[destinationIndex - 1].order) !== null && _c !== void 0 ? _c : 0;
                    const nextOrder = (_d = destTasks[destinationIndex].order) !== null && _d !== void 0 ? _d : defaultOrderGap; // Use gap if next doesn't exist somehow
                    newOrder = (prevOrder + nextOrder) / 2;
                }
                // Handle potential floating point precision issues or zero values if necessary
                if (newOrder <= 0) {
                    // This might happen if dividing very small numbers. Re-adjust.
                    // A more robust solution might involve re-spacing orders periodically.
                    // For now, just place it slightly after the previous or at the start.
                    if (destinationIndex > 0) {
                        newOrder =
                            ((_e = destTasks[destinationIndex - 1].order) !== null && _e !== void 0 ? _e : 0) + defaultOrderGap / 10;
                    }
                    else {
                        newOrder = defaultOrderGap / 10;
                    }
                }
                // 3. Update the moved task with new status and calculated order
                yield prisma.task.update({
                    where: { id },
                    data: {
                        order: newOrder,
                        status: isCompleted ? existingTask.status : status, // Keep original status if completed, otherwise use new status
                        completed: isCompleted,
                        scheduled: !isUnscheduled,
                        // Reset date/time if moved to unscheduled
                        date: isUnscheduled ? null : existingTask.date,
                        startTime: isUnscheduled ? null : existingTask.startTime,
                        endTime: isUnscheduled ? null : existingTask.endTime,
                        duration: isUnscheduled ? null : existingTask.duration,
                    },
                });
                // Note: No need to manually increment/decrement orders of other tasks
                // when using fractional/float ordering like this.
            }));
            return res.status(200).json({
                message: "Task position updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task position:", error);
            return res.status(500).json({
                message: "Error updating task position: " + error,
                success: false,
            });
        }
    });
}
function getTasksByDate(req, res) {
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
            const { date } = req.body;
            if (!date) {
                return res.status(400).json({
                    message: "Date parameter is required",
                    success: false,
                });
            }
            // Create date objects for the start and end of the requested day
            const requestedDate = new Date(date);
            requestedDate.setHours(0, 0, 0, 0); // Start of day
            const endOfDay = new Date(requestedDate);
            endOfDay.setHours(23, 59, 59, 999); // End of day
            const tasks = yield prisma_1.db.task.findMany({
                where: {
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                    scheduled: true,
                    date: {
                        gte: requestedDate,
                        lte: endOfDay,
                    },
                },
                include: {
                    assignedTo: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    resources: true,
                    project: {
                        // Add this section to include project details
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                        },
                    },
                },
            });
            // Transform the response to match the expected format
            const transformedTasks = tasks.map((task) => {
                var _a;
                return (Object.assign(Object.assign({}, task), { 
                    // Ensure dates are properly formatted
                    date: task.date ? new Date(task.date).toISOString() : null, startTime: task.startTime ? new Date(task.startTime).toISOString() : null, endTime: task.endTime ? new Date(task.endTime).toISOString() : null, createdAt: new Date(task.createdAt).toISOString(), updatedAt: new Date(task.updatedAt).toISOString(), 
                    // Transform assignees
                    assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => ({
                        id: assignment.user.id,
                        name: assignment.user.name,
                        profilePic: assignment.user.image,
                    }))) || [], 
                    // Transform project info
                    project: task.project
                        ? {
                            id: task.project.id,
                            name: task.project.name,
                            ownerId: task.project.ownerId,
                        }
                        : null, 
                    // Ensure other fields have default values
                    status: task.status || "unscheduled", order: task.order || 0, tags: task.tags || [] }));
            });
            return res.status(200).json({
                message: "Tasks fetched successfully",
                tasks: transformedTasks,
                success: true,
            });
        }
        catch (error) {
            console.error("Error fetching tasks by date:", error);
            return res.status(500).json({
                message: "Error fetching tasks by date: " + error,
                success: false,
            });
        }
    });
}
function updateTaskTimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            const { startTime, endTime, duration, date } = req.body;
            if (!id) {
                return res.status(400).json({
                    message: "No task id provided",
                    success: false,
                });
            }
            if (!startTime || !endTime || !duration) {
                return res.status(400).json({
                    message: "Missing required time parameters",
                    success: false,
                });
            }
            const existingTask = yield prisma_1.db.task.findUnique({
                where: { id },
            });
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found",
                    success: false,
                });
            }
            // Update task with new time values
            yield prisma_1.db.task.update({
                where: { id },
                data: {
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    duration,
                    date: new Date(date),
                    scheduled: true, // Ensure the task is marked as scheduled
                },
            });
            if (existingTask.teamId) {
                yield prisma_1.db.teamActivity.create({
                    data: {
                        teamId: existingTask.teamId,
                        action: "updated",
                        type: "task",
                        userId: session.user.id,
                    },
                });
            }
            return res.status(200).json({
                message: "Task times updated successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error updating task times:", error);
            return res.status(500).json({
                message: "Error updating task times: " + error,
                success: false,
            });
        }
    });
}
function getCalendarTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    message: "Start and end dates are required",
                    success: false,
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            const tasks = yield prisma_1.db.task.findMany({
                where: {
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                    scheduled: true,
                    date: {
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    assignedTo: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [{ date: "asc" }, { startTime: "asc" }],
            });
            const transformedTasks = tasks.map((task) => {
                var _a;
                return (Object.assign(Object.assign({}, task), { assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => ({
                        id: assignment.user.id,
                        name: assignment.user.name,
                        profilePic: assignment.user.image,
                    }))) || [] }));
            });
            return res.status(200).json({
                tasks: transformedTasks,
                success: true,
            });
        }
        catch (error) {
            console.error("Error fetching calendar tasks:", error);
            return res.status(500).json({
                message: "Error fetching calendar tasks: " + error,
                success: false,
            });
        }
    });
}
function getAllTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        // if (!session) {
        //   return res.status(401).send({
        //     message: "Unauthorized",
        //     success: false,
        //   });
        // }
        try {
            const tasks = yield prisma_1.db.task.findMany({
                include: {
                    assignedTo: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    resources: true,
                    project: {
                        // Add this section to include project details
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                tasks,
                success: true,
            });
        }
        catch (error) {
            console.error("Error fetching all tasks:", error);
            return res.status(500).json({
                message: "Error fetching all tasks: " + error,
                success: false,
            });
        }
    });
}
function getTodayTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            const tasks = yield prisma_1.db.task.findMany({
                where: {
                    OR: [
                        { userId: session.user.id },
                        {
                            assignedTo: {
                                some: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    ],
                    scheduled: true,
                    date: {
                        gte: today,
                        lte: endOfDay,
                    },
                },
                include: {
                    assignedTo: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    resources: true,
                    project: {
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                        },
                    },
                },
                orderBy: [
                    { completed: "asc" },
                    { priority: "desc" },
                    { startTime: "asc" },
                ],
            });
            const transformedTasks = tasks.map((task) => {
                var _a;
                return (Object.assign(Object.assign({}, task), { assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => ({
                        id: assignment.user.id,
                        name: assignment.user.name,
                        profilePic: assignment.user.image,
                    }))) || [] }));
            });
            return res.status(200).json({
                data: transformedTasks,
                message: "Today's tasks fetched successfully",
                success: true,
            });
        }
        catch (error) {
            console.error("Error fetching today's tasks:", error);
            return res.status(500).json({
                message: "Error fetching today's tasks: " + error,
                success: false,
                error: error,
            });
        }
    });
}
function getTaskAnalytics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const session = yield auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const { timeframe } = req.query;
            const userId = session.user.id;
            // Determine date range based on timeframe
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            let startDate = new Date();
            if (timeframe === "week") {
                startDate.setDate(today.getDate() - 6); // Last 7 days including today
            }
            else if (timeframe === "month") {
                startDate.setDate(today.getDate() - 29); // Last 30 days including today
            }
            else if (timeframe === "quarter") {
                startDate.setDate(today.getDate() - 89); // Last 90 days including today
            }
            else {
                startDate.setDate(today.getDate() - 6); // Default to week
            }
            startDate.setHours(0, 0, 0, 0);
            // Get tasks created within the date range
            const createdTasks = yield prisma_1.db.task.groupBy({
                by: ["date"],
                where: {
                    userId: userId,
                    createdAt: {
                        gte: startDate,
                        lte: today,
                    },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    date: "asc",
                },
            });
            // Get completed tasks within the date range
            const completedTasks = yield prisma_1.db.task.groupBy({
                by: ["date"],
                where: {
                    userId: userId,
                    completed: true,
                    updatedAt: {
                        gte: startDate,
                        lte: today,
                    },
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    date: "asc",
                },
            });
            // Build the date range array
            const dateRange = [];
            const currentDate = new Date(startDate);
            while (currentDate <= today) {
                const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
                // Find counts for this date
                const createdCount = ((_b = (_a = createdTasks.find((item) => {
                    const itemDate = item.date
                        ? new Date(item.date).toISOString().split("T")[0]
                        : null;
                    return itemDate === dateStr;
                })) === null || _a === void 0 ? void 0 : _a._count) === null || _b === void 0 ? void 0 : _b.id) || 0;
                const completedCount = ((_d = (_c = completedTasks.find((item) => {
                    const itemDate = item.date
                        ? new Date(item.date).toISOString().split("T")[0]
                        : null;
                    return itemDate === dateStr;
                })) === null || _c === void 0 ? void 0 : _c._count) === null || _d === void 0 ? void 0 : _d.id) || 0;
                dateRange.push({
                    date: dateStr,
                    created: createdCount,
                    completed: completedCount,
                });
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return res.status(200).json({
                data: dateRange,
                success: true,
            });
        }
        catch (error) {
            console.error("Error fetching task analytics:", error);
            return res.status(500).json({
                message: "Error fetching task analytics: " + error,
                success: false,
            });
        }
    });
}
