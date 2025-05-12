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
exports.deleteAccount = deleteAccount;
exports.linkCredentials = linkCredentials;
exports.updateLanguage = updateLanguage;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("../lib/crypto");
function deleteAccount(req, res) {
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
        const id = req.params.id;
        const account = yield prisma_1.db.account.findUnique({
            where: {
                id: id,
                userId: session.user.id,
            },
        });
        if (!account) {
            return res.status(404).send({
                message: "Account not found",
                success: false,
            });
        }
        yield prisma_1.db.account.delete({
            where: {
                id: id,
            },
        });
        // Changed from 204 to 200 to ensure consistent JSON response
        return res.status(200).json({
            message: "Account deleted",
            success: true,
        });
    });
}
function linkCredentials(req, res) {
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
            const { encryptedData } = req.body;
            const decryptedData = (0, crypto_1.decryptData)(encryptedData);
            const { username, password } = decryptedData;
            yield prisma_1.db.user.update({
                where: {
                    id: session.user.id,
                },
                data: {
                    username: username,
                    displayUsername: username,
                },
            });
            yield auth_1.auth.api.setPassword({
                headers: headers,
                body: {
                    newPassword: password,
                },
            });
            return res.status(200).json({
                message: "Credentials updated",
                success: true,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error updating credentials " + error,
                success: false,
            });
        }
    });
}
function updateLanguage(req, res) {
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
            const lang = req.query.lang;
            if (!lang) {
                return res.status(400).json({
                    message: "Language not provided",
                    success: false,
                });
            }
            yield prisma_1.db.user.update({
                where: {
                    id: session.user.id,
                },
                data: {
                    lang: lang,
                },
            });
            return res.status(200).json({
                message: "Language updated",
                success: true,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error updating language " + error,
                success: false,
            });
        }
    });
}
