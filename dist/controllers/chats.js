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
exports.createChat = createChat;
exports.getChats = getChats;
exports.getChatById = getChatById;
exports.updateChat = updateChat;
exports.updateChatMembers = updateChatMembers;
exports.deleteChat = deleteChat;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
function createChat(req, res) {
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
        const { participantIds, type, name } = req.body;
        try {
            // Validate participants
            if (type === "individual" && participantIds.length !== 1) {
                return res.status(400).json({
                    message: "Individual chat must have exactly one participant",
                    success: false,
                });
            }
            // For individual chats, check if chat already exists
            if (type === "individual") {
                const existingChat = yield prisma_1.db.chat.findFirst({
                    where: {
                        type: "individual",
                        participants: {
                            every: {
                                userId: {
                                    in: [session.user.id, participantIds[0]],
                                },
                            },
                        },
                    },
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                        messages: {
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        username: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (existingChat) {
                    return res.status(200).json({
                        message: "Chat already exists",
                        success: true,
                        data: existingChat,
                    });
                }
            }
            // Create new chat
            const chat = yield prisma_1.db.chat.create({
                data: {
                    type,
                    name: type === "group" ? name : undefined,
                    participants: {
                        create: [
                            { userId: session.user.id, role: "admin" },
                            ...participantIds.map((id) => ({
                                userId: id,
                                role: "member",
                            })),
                        ],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    messages: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Chat created successfully",
                success: true,
                data: chat,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error creating chat",
                success: false,
            });
        }
    });
}
function getChats(req, res) {
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
            const chats = yield prisma_1.db.chat.findMany({
                where: {
                    participants: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
            });
            return res.status(200).json({
                message: "Chats fetched successfully",
                success: true,
                data: chats,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error fetching chats",
                success: false,
            });
        }
    });
}
function getChatById(req, res) {
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
        const chatId = req.params.id;
        try {
            const chat = yield prisma_1.db.chat.findFirst({
                where: {
                    id: chatId,
                    participants: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found",
                    success: false,
                });
            }
            return res.status(200).json({
                message: "Chat fetched successfully",
                success: true,
                data: chat,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error fetching chat",
                success: false,
            });
        }
    });
}
function updateChat(req, res) {
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
        const chatId = req.params.id;
        const { name } = req.body;
        try {
            const chat = yield prisma_1.db.chat.findFirst({
                where: {
                    id: chatId,
                    participants: {
                        some: {
                            userId: session.user.id,
                            role: "admin",
                        },
                    },
                },
            });
            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found or unauthorized",
                    success: false,
                });
            }
            const updatedChat = yield prisma_1.db.chat.update({
                where: {
                    id: chatId,
                },
                data: {
                    name,
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    messages: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Chat updated successfully",
                success: true,
                data: updatedChat,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error updating chat",
                success: false,
            });
        }
    });
}
function updateChatMembers(req, res) {
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
        const chatId = req.params.id;
        const { addMembers, removeMembers, roleUpdates } = req.body;
        try {
            const chat = yield prisma_1.db.chat.findFirst({
                where: {
                    id: chatId,
                    participants: {
                        some: {
                            userId: session.user.id,
                            role: "admin",
                        },
                    },
                },
            });
            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found or unauthorized",
                    success: false,
                });
            }
            // Handle member removals
            if (removeMembers === null || removeMembers === void 0 ? void 0 : removeMembers.length) {
                yield prisma_1.db.chatParticipant.deleteMany({
                    where: {
                        chatId,
                        userId: {
                            in: removeMembers,
                        },
                    },
                });
            }
            // Handle new members
            if (addMembers === null || addMembers === void 0 ? void 0 : addMembers.length) {
                yield prisma_1.db.chatParticipant.createMany({
                    data: addMembers.map((userId) => ({
                        chatId,
                        userId,
                        role: "member",
                    })),
                    skipDuplicates: true,
                });
            }
            // Handle role updates
            if (roleUpdates === null || roleUpdates === void 0 ? void 0 : roleUpdates.length) {
                yield Promise.all(roleUpdates.map((update) => prisma_1.db.chatParticipant.update({
                    where: {
                        userId_chatId: {
                            chatId,
                            userId: update.userId,
                        },
                    },
                    data: {
                        role: update.role,
                    },
                })));
            }
            const updatedChat = yield prisma_1.db.chat.findUnique({
                where: {
                    id: chatId,
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Chat members updated successfully",
                success: true,
                data: updatedChat,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error updating chat members",
                success: false,
            });
        }
    });
}
function deleteChat(req, res) {
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
        const chatId = req.params.id;
        try {
            // Check if user is admin of the group
            const chat = yield prisma_1.db.chat.findFirst({
                where: {
                    id: chatId,
                    participants: {
                        some: {
                            userId: session.user.id,
                            role: "admin",
                        },
                    },
                },
            });
            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found or unauthorized",
                    success: false,
                });
            }
            // Delete the chat and all related records (cascade delete will handle this)
            yield prisma_1.db.chat.delete({
                where: {
                    id: chatId,
                },
            });
            return res.status(200).json({
                message: "Chat deleted successfully",
                success: true,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error deleting chat",
                success: false,
            });
        }
    });
}
