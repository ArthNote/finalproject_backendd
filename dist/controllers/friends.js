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
exports.getFriends = getFriends;
exports.sendFriendRequest = sendFriendRequest;
exports.respondToFriendRequest = respondToFriendRequest;
exports.deleteFriendship = deleteFriendship;
exports.getFriendRequests = getFriendRequests;
exports.cancelFriendRequest = cancelFriendRequest;
exports.searchUsers = searchUsers;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
function getFriends(req, res) {
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
            const friends = yield prisma_1.db.friendship.findMany({
                where: {
                    OR: [
                        { senderId: session.user.id, status: "accepted" },
                        { receiverId: session.user.id, status: "accepted" },
                    ],
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
                    receiver: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Friends fetched successfully",
                success: true,
                data: friends,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error fetching friends", success: false });
        }
    });
}
function sendFriendRequest(req, res) {
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
        const { userId } = req.body;
        if (!userId) {
            return res.status(401).send({
                message: "User ID is required",
                success: false,
            });
        }
        try {
            // Check if the userId is valid and exists in the database
            const user = yield prisma_1.db.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(401).send({
                    message: "User not found",
                    success: false,
                });
            }
            // Check if friendship already exists
            const existingFriendship = yield prisma_1.db.friendship.findFirst({
                where: {
                    OR: [
                        { senderId: session.user.id, receiverId: userId },
                        { senderId: userId, receiverId: session.user.id },
                    ],
                },
            });
            if (existingFriendship) {
                return res.status(200).json({
                    message: "Friendship already exists",
                    success: true,
                    code: "friendship_exists",
                });
            }
            // Create new friendship request
            yield prisma_1.db.friendship.create({
                data: {
                    senderId: session.user.id,
                    receiverId: userId,
                    status: "pending",
                },
            });
            return res.status(200).json({
                message: "Friend request sent successfully",
                success: true,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error sending friend request", success: false });
        }
    });
}
function respondToFriendRequest(req, res) {
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
        const { friendshipId, action } = req.body;
        if (!friendshipId || !action) {
            return res.status(400).json({
                message: "Friendship ID and action are required",
                success: false,
            });
        }
        try {
            const friendship = yield prisma_1.db.friendship.findFirst({
                where: {
                    id: friendshipId,
                    receiverId: session.user.id,
                    status: "pending",
                },
            });
            if (!friendship) {
                return res
                    .status(404)
                    .json({ message: "Friend request not found", success: false });
            }
            if (action === "accept") {
                yield prisma_1.db.friendship.update({
                    where: { id: friendshipId },
                    data: { status: "accepted" },
                });
            }
            else {
                yield prisma_1.db.friendship.delete({
                    where: { id: friendshipId },
                });
            }
            return res
                .status(200)
                .json({ message: "Request processed successfully", success: true });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error processing friend request", success: false });
        }
    });
}
function deleteFriendship(req, res) {
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
        const { friendshipId } = req.body;
        if (!friendshipId) {
            return res.status(400).json({
                message: "Friendship ID is required",
                success: false,
            });
        }
        try {
            const friendship = yield prisma_1.db.friendship.findUnique({
                where: {
                    id: friendshipId,
                    OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
                },
            });
            if (!friendship) {
                return res.status(404).json({
                    message: "Friendship not found",
                    success: false,
                });
            }
            yield prisma_1.db.friendship.delete({
                where: { id: friendshipId },
            });
            return res.status(200).json({
                message: "Friendship deleted successfully",
                success: true,
            });
        }
        catch (error) {
            return res
                .status(500)
                .json({ message: "Error deleting friendship", success: false });
        }
    });
}
function getFriendRequests(req, res) {
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
            const received = yield prisma_1.db.friendship.findMany({
                where: {
                    receiverId: session.user.id,
                    status: "pending",
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
                },
            });
            const sent = yield prisma_1.db.friendship.findMany({
                where: {
                    senderId: session.user.id,
                    status: "pending",
                },
                include: {
                    receiver: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Friend requests fetched successfully",
                success: true,
                data: { received, sent },
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error fetching friend requests",
                success: false,
            });
        }
    });
}
function cancelFriendRequest(req, res) {
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
        const { friendshipId } = req.body;
        if (!friendshipId) {
            return res.status(400).json({
                message: "Friendship ID is required",
                success: false,
            });
        }
        try {
            const friendship = yield prisma_1.db.friendship.findFirst({
                where: {
                    id: friendshipId,
                    senderId: session.user.id,
                    status: "pending",
                },
            });
            if (!friendship) {
                return res.status(404).json({
                    message: "Friend request not found",
                    success: false,
                });
            }
            yield prisma_1.db.friendship.delete({
                where: { id: friendshipId },
            });
            return res.status(200).json({
                message: "Friend request canceled successfully",
                success: true,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error canceling friend request",
                success: false,
            });
        }
    });
}
function searchUsers(req, res) {
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
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.status(200).json({
                message: "Search term too short",
                success: true,
                data: [],
            });
        }
        try {
            // Search users by username, name, or email
            const users = yield prisma_1.db.user.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { username: { contains: query, mode: "insensitive" } },
                                { name: { contains: query, mode: "insensitive" } },
                                { email: { contains: query, mode: "insensitive" } },
                            ],
                        },
                        { id: { not: session.user.id } }, // Exclude current user
                    ],
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    image: true,
                },
                take: 10,
            });
            // Check existing friendships
            const existingFriendships = yield prisma_1.db.friendship.findMany({
                where: {
                    OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
                },
            });
            const usersWithStatus = users.map((user) => {
                var _a;
                return (Object.assign(Object.assign({}, user), { friendshipStatus: ((_a = existingFriendships.find((f) => f.senderId === user.id || f.receiverId === user.id)) === null || _a === void 0 ? void 0 : _a.status) || "none", hasPendingRequest: existingFriendships.some((f) => f.status === "pending" &&
                        ((f.senderId === session.user.id && f.receiverId === user.id) ||
                            (f.receiverId === session.user.id && f.senderId === user.id))) }));
            });
            return res.status(200).json({
                message: "Users found",
                success: true,
                data: usersWithStatus,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Error searching users",
                success: false,
            });
        }
    });
}
