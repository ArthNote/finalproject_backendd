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
exports.getTeam = getTeam;
exports.createResource = createResource;
exports.deleteResource = deleteResource;
const node_1 = require("better-auth/node");
const auth_1 = require("../lib/auth");
const prisma_1 = require("../lib/prisma");
const cloudinary_1 = require("../lib/cloudinary");
function getTeam(req, res) {
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
            // if (!session.session.activeOrganizationId) {
            //   return res.status(400).send({
            //     message: "No active organization found",
            //     success: false,
            //   });
            // }
            // const orgs = await auth.api.listOrganizations({
            //   headers: headers,
            // });
            // if (!orgs) {
            //   return res.status(400).send({
            //     message: "No organizations found",
            //     success: false,
            //   });
            // }
            // const activeOrg = orgs[0];
            const team = yield prisma_1.db.team.findFirst({
                where: {
                    organizationId: session.user.activeOrganizationId,
                },
                include: {
                    tasks: {
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
                    },
                    activity: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            user: true,
                        },
                    },
                    resources: {
                        include: {
                            createdBy: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    organization: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!team) {
                return res.status(404).send({
                    message: "Team not found",
                    success: false,
                });
            }
            const sub = yield prisma_1.db.subscription.findFirst({
                where: {
                    referenceId: session.user.activeOrganizationId,
                },
            });
            if (!sub) {
                return res.status(404).send({
                    message: "Subscription not found",
                    success: false,
                });
            }
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
            const storageUsed = team.resources.reduce((total, resource) => {
                if (resource.type === "file" && resource.size) {
                    return total + resource.size;
                }
                return total;
            }, 0);
            const teamData = {
                id: team.id,
                name: team.name,
                description: "Team workspace",
                memberCount: team.organization.members.length,
                plan: {
                    name: "team",
                    memberLimit: 10,
                    features: ["feature1", "feature2"],
                },
                members: team.organization.members.map((member) => {
                    var _a, _b, _c;
                    return ({
                        id: member.id,
                        name: (_a = member.user.username) !== null && _a !== void 0 ? _a : member.user.name,
                        email: (_b = member.user.email) !== null && _b !== void 0 ? _b : "",
                        role: member.role,
                        avatar: (_c = member.user.image) !== null && _c !== void 0 ? _c : "",
                        userId: member.user.id,
                    });
                }),
                subscription: {
                    seats: {
                        used: team.organization.members.length,
                        total: 10,
                    },
                    storage: {
                        used: storageUsed,
                        total: 100,
                        unit: "GB",
                    },
                    plan: {
                        name: "team",
                        memberLimit: 10,
                        features: ["feature1", "feature2"],
                        status: sub === null || sub === void 0 ? void 0 : sub.status,
                        renewalDate: sub.periodEnd.toDateString(),
                    },
                },
                storage: {
                    used: storageUsed,
                    total: 100,
                },
                activity: team.activity.map((activity) => {
                    var _a, _b;
                    return ({
                        id: activity.id,
                        user: {
                            name: (_a = activity.user.username) !== null && _a !== void 0 ? _a : activity.user.name,
                            avatar: (_b = activity.user.image) !== null && _b !== void 0 ? _b : null,
                        },
                        type: activity.type,
                        action: activity.action,
                        date: activity.createdAt,
                    });
                }),
                tasks: transformTaskAssignees(team.tasks),
                resources: team.resources.map((resource) => {
                    var _a, _b;
                    return {
                        id: resource.id,
                        name: resource.name,
                        type: resource.type,
                        url: (_a = resource.url) !== null && _a !== void 0 ? _a : "",
                        size: (_b = resource.size) !== null && _b !== void 0 ? _b : 0,
                        uploadedBy: resource.createdBy.name,
                        createdAt: resource.createdAt,
                    };
                }),
            };
            return res.status(200).json({
                message: "Team fetched successfully",
                success: true,
                data: teamData,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error fetching team", success: false });
        }
    });
}
function createResource(req, res) {
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
            // if (!session.session.activeOrganizationId) {
            //   return res.status(400).send({
            //     message: "No active organization found",
            //     success: false,
            //   });
            // }
            // const orgs = await auth.api.listOrganizations({
            //   headers: headers,
            // });
            // if (!orgs) {
            //   return res.status(400).send({
            //     message: "No organizations found",
            //     success: false,
            //   });
            // }
            // const activeOrg = orgs[0];
            const team = yield prisma_1.db.team.findFirst({
                where: {
                    organizationId: session.user.activeOrganizationId,
                },
            });
            if (!team) {
                return res.status(404).send({
                    message: "Team not found",
                    success: false,
                });
            }
            const { name, type, url, fileData, fileName, fileSize, fileType } = req.body;
            if (!name || !type) {
                return res.status(400).send({
                    message: "Name and type are required",
                    success: false,
                });
            }
            if (type === "link" && !url) {
                return res.status(400).send({
                    message: "URL is required for link type",
                    success: false,
                });
            }
            if (type === "link") {
                yield prisma_1.db.teamResource.create({
                    data: {
                        name: name,
                        type: type,
                        url: url,
                        createdById: session.user.id,
                        teamId: team.id,
                    },
                });
            }
            if (type === "file" && !fileData && !fileName && !fileSize && !fileType) {
                return res.status(400).send({
                    message: "Filedata, fileName, and fileSize are required for file type",
                    success: false,
                });
            }
            if (type === "file") {
                let fileUrl = "";
                const fileTy = "image";
                try {
                    const uploadResult = yield cloudinary_1.uploadToCloudinary.upload(fileData, "teamFiles-" + team.id, fileTy);
                    fileUrl = uploadResult.secure_url;
                }
                catch (uploadError) {
                    console.error("Backend: Cloudinary upload error:", uploadError);
                    return res.status(500).json({
                        message: "Error uploading file",
                        success: false,
                        error: uploadError.message,
                    });
                }
                yield prisma_1.db.teamResource.create({
                    data: {
                        name: fileName || "File",
                        type: type,
                        url: fileUrl,
                        createdById: session.user.id,
                        teamId: team.id,
                        size: fileSize,
                    },
                });
            }
            yield prisma_1.db.teamActivity.create({
                data: {
                    userId: session.user.id,
                    teamId: team.id,
                    type: "resource",
                    action: "created",
                },
            });
            return res.status(200).json({
                message: "Resource created successfully",
                success: true,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error creating resource", success: false });
        }
    });
}
function deleteResource(req, res) {
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
            const resource = yield prisma_1.db.teamResource.findUnique({
                where: { id: req.params.id },
                include: { team: true },
            });
            if (!resource) {
                return res.status(404).json({
                    message: "Resource not found",
                    success: false,
                });
            }
            // const orgs = await auth.api.listOrganizations({
            //   headers: headers,
            // });
            // if (!orgs) {
            //   return res.status(400).send({
            //     message: "No organizations found",
            //     success: false,
            //   });
            // }
            // const activeOrg = orgs[0];
            // Check if user has access to the team
            if (resource.team.organizationId !== session.user.activeOrganizationId) {
                return res.status(403).json({
                    message: "Unauthorized to delete this resource",
                    success: false,
                });
            }
            yield prisma_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // If it's a file, delete from Cloudinary
                if (resource.type === "file" && resource.url) {
                    // Extract public_id from URL
                    const urlParts = resource.url.split("/");
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `teamFiles-${resource.teamId}/${publicIdWithExt.split(".")[0]}`;
                    yield cloudinary_1.uploadToCloudinary.deleteFile(publicId);
                }
                // Delete from database
                yield tx.teamResource.delete({
                    where: { id: req.params.id },
                });
                // Create activity log
                yield tx.teamActivity.create({
                    data: {
                        userId: session.user.id,
                        teamId: resource.teamId,
                        type: "resource",
                        action: "deleted",
                    },
                });
            }));
            return res.status(200).json({
                message: "Resource deleted successfully",
                success: true,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error deleting resource",
                success: false,
                error: error.message,
            });
        }
    });
}
