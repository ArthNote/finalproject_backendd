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
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.updateMessageStatus = updateMessageStatus;
exports.searchMessages = searchMessages;
exports.deleteMessage = deleteMessage;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../lib/socket");
const cloudinary_1 = require("../lib/cloudinary"); // Assuming you have a cloudinary upload function
function sendMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Backend: sendMessage called");
        try {
            const headers = (0, node_1.fromNodeHeaders)(req.headers);
            const session = yield auth_1.auth.api.getSession({
                headers: headers,
            });
            if (!session) {
                console.log("Backend: No session found");
                return res.status(401).send({
                    message: "Unauthorized",
                    success: false,
                });
            }
            console.log("Backend: Auth OK, user:", session.user.id);
            const chatId = req.params.chatId;
            const { content, type, fileName, fileSize, fileData, replyToId } = req.body;
            console.log("Backend: Message params:", {
                chatId,
                type,
                hasFileData: !!fileData,
                fileDataLength: fileData === null || fileData === void 0 ? void 0 : fileData.length,
                fileName,
                fileSize,
                hasReply: !!replyToId,
            });
            let fileUrl = "";
            // Handle file uploads
            if (fileData && (type === "file" || type === "image")) {
                console.log("Backend: Uploading file to Cloudinary");
                try {
                    const uploadResult = yield cloudinary_1.uploadToCloudinary.upload(fileData, type === "image" ? "images" : "files");
                    fileUrl = uploadResult.secure_url;
                    console.log("Backend: File uploaded successfully", {
                        fileUrl: fileUrl.substring(0, 50) + "...", // Log partial URL for privacy
                    });
                }
                catch (uploadError) {
                    console.error("Backend: Cloudinary upload error:", uploadError);
                    return res.status(500).json({
                        message: "Error uploading file",
                        success: false,
                        error: uploadError.message,
                    });
                }
            }
            console.log("Backend: Creating message in database");
            const message = yield prisma_1.db.message.create({
                data: {
                    content: type === "text" ? content : fileUrl,
                    type,
                    fileName,
                    fileSize,
                    fileUrl,
                    senderId: session.user.id,
                    chatId,
                    status: "sent",
                    replyToId: replyToId || null, // Add the replyToId
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log("Backend: Message created:", { messageId: message.id });
            const chatParticipants = yield prisma_1.db.chatParticipant.findMany({
                where: {
                    chatId: chatId,
                    userId: {
                        not: session.user.id,
                    },
                },
            });
            // Emit to all participants
            chatParticipants.forEach((participant) => {
                const receiverSocketId = (0, socket_1.getReceiverSocketId)(participant.userId);
                if (receiverSocketId) {
                    socket_1.io.to(receiverSocketId).emit("newMessage", Object.assign(Object.assign({}, message), { chatId }));
                }
            });
            return res.status(200).json({
                message: "Message sent successfully",
                success: true,
                data: message,
            });
        }
        catch (error) {
            console.error("Backend error in sendMessage:", error);
            return res.status(500).json({
                message: "Error creating message",
                success: false,
                error: error.message,
            });
        }
    });
}
function getMessages(req, res) {
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
        const chatId = req.params.chatId;
        const cursor = req.query.cursor;
        const limit = parseInt(req.query.limit) || 50;
        try {
            const messages = yield prisma_1.db.message.findMany({
                where: { chatId },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: "asc" }, // Change to ascending order
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });
            const hasMore = messages.length > limit;
            const nextCursor = hasMore ? messages[limit - 1].id : undefined;
            const data = hasMore ? messages.slice(0, -1) : messages;
            return res.status(200).json({
                message: "Messages retrieved successfully",
                success: true,
                data: {
                    messages: data,
                    hasMore,
                    nextCursor,
                },
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error retrieving messages",
                success: false,
            });
        }
    });
}
function updateMessageStatus(req, res) {
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
        const { messageId } = req.params;
        const { status } = req.body;
        try {
            const message = yield prisma_1.db.message.update({
                where: { id: messageId },
                data: { status },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            });
            // Emit status update to sender
            socket_1.io.to(`user_${message.senderId}`).emit("message:status", {
                messageId: message.id,
                status,
            });
            return res.status(200).json({
                message: "Message status updated successfully",
                success: true,
                data: message,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error updating message status",
                success: false,
            });
        }
    });
}
function searchMessages(req, res) {
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
        const chatId = req.params.chatId;
        const query = req.query.q;
        try {
            const messages = yield prisma_1.db.message.findMany({
                where: {
                    chatId,
                    content: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Messages found successfully",
                success: true,
                data: messages,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error searching messages",
                success: false,
            });
        }
    });
}
function deleteMessage(req, res) {
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
        const { messageId } = req.params;
        try {
            const message = yield prisma_1.db.message.findFirst({
                where: {
                    id: messageId,
                    senderId: session.user.id, // Only allow deletion of own messages
                },
            });
            if (!message) {
                return res.status(404).json({
                    message: "Message not found or unauthorized",
                    success: false,
                });
            }
            yield prisma_1.db.message.delete({
                where: { id: messageId },
            });
            // Emit message deletion event to all participants in the chat
            socket_1.io.to(`chat_${message.chatId}`).emit("message:delete", {
                messageId: message.id,
            });
            return res.status(200).json({
                message: "Message deleted successfully",
                success: true,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error deleting message",
                success: false,
            });
        }
    });
}
