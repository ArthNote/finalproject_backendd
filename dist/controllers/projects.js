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
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const prisma_1 = require("../lib/prisma");
const node_1 = require("better-auth/node");
const auth_1 = require("../lib/auth");
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const query = req.query;
        const { search, status, ownerId, memberId, tags, priority, sortBy = "updatedAt", sortOrder = "desc", } = query;
        const where = {
            AND: [
                // Search by name or description
                { ownerId: (_a = session.user) === null || _a === void 0 ? void 0 : _a.id },
                search
                    ? {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {},
                // Filter by status
                status ? { status } : {},
                // Filter by member
                memberId
                    ? {
                        members: {
                            some: { userId: memberId },
                        },
                    }
                    : {},
                // Filter by tags
                tags && tags.length > 0
                    ? {
                        tags: { hasEvery: typeof tags === "string" ? [tags] : tags },
                    }
                    : {},
                // Filter by priority
                priority ? { priority } : {},
            ],
        };
        const orderBy = {
            [sortBy]: sortOrder,
        };
        const projects = yield prisma_1.db.project.findMany({
            where,
            orderBy,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                members: {
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
                tasks: true,
            },
        });
        return res.status(200).json({
            message: "Projects fetched successfully",
            success: true,
            data: projects,
        });
    }
    catch (error) {
        console.error("Error getting projects:", error);
        res.status(500).json({ message: "Failed to get projects", success: false });
    }
});
exports.getProjects = getProjects;
const getProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const { id } = req.params;
        const project = yield prisma_1.db.project.findUnique({
            where: { id: id, ownerId: (_a = session.user) === null || _a === void 0 ? void 0 : _a.id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                members: {
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
                tasks: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                ownerId: true,
                            },
                        },
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
                },
            },
        });
        // Transform tasks to include proper project info
        if (project) {
            project.tasks = project.tasks.map((task) => {
                var _a;
                return (Object.assign(Object.assign({}, task), { project: {
                        id: project.id,
                        name: project.name,
                        ownerId: project.ownerId,
                    }, assignedTo: ((_a = task.assignedTo) === null || _a === void 0 ? void 0 : _a.map((assignment) => (Object.assign(Object.assign({}, assignment), { user: {
                            id: assignment.user.id,
                            name: assignment.user.name,
                            image: assignment.user.image,
                        } })))) || [] }));
            });
        }
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Project fetched successfully",
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Error getting project:", error);
        res.status(500).json({ message: "Failed to get project", success: false });
    }
});
exports.getProject = getProject;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const projectData = req.body;
        const userId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
        const project = yield prisma_1.db.project.create({
            data: Object.assign(Object.assign({}, projectData), { status: projectData.status || "NOT_STARTED", priority: projectData.priority || "MEDIUM", ownerId: userId, members: {
                    create: {
                        userId,
                        role: "owner",
                    },
                } }),
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                members: {
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
        });
        return res.status(201).json({
            message: "Project created successfully",
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Error creating project:", error);
        res
            .status(500)
            .json({ message: "Failed to create project", success: false });
    }
});
exports.createProject = createProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const { id } = req.params;
        const projectData = req.body;
        const userId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
        const data = Object.assign(Object.assign({}, projectData), (projectData.progress !== undefined && {
            progress: Number(projectData.progress),
        }));
        // Check if user is owner or admin
        const projectMember = yield prisma_1.db.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: id,
                    userId,
                },
            },
        });
        if (!projectMember || !["owner", "admin"].includes(projectMember.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const project = yield prisma_1.db.project.update({
            where: { id },
            data: data,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                members: {
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
                tasks: true,
            },
        });
        return res.status(200).json({
            message: "Project updated successfully",
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Error updating project:", error);
        res
            .status(500)
            .json({ message: "Failed to update project", success: false });
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const { id } = req.params;
        const userId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
        // Check if user is owner
        const project = yield prisma_1.db.project.findUnique({
            where: { id },
            select: { ownerId: true },
        });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        if (project.ownerId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        yield prisma_1.db.project.delete({
            where: { id },
        });
        return res.status(200).json({
            message: "Project deleted successfully",
            success: true,
        });
    }
    catch (error) {
        console.error("Error deleting project:", error);
        res
            .status(500)
            .json({ message: "Failed to delete project", success: false });
    }
});
exports.deleteProject = deleteProject;
