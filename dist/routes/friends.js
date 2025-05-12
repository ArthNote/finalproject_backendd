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
const express_1 = require("express");
const friends_1 = require("../controllers/friends");
const router = (0, express_1.Router)();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.getFriends)(req, res);
}));
router.post("/send-request", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.sendFriendRequest)(req, res);
}));
router.post("/respond", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.respondToFriendRequest)(req, res);
}));
router.delete("/delete", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.deleteFriendship)(req, res);
}));
router.get("/requests", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.getFriendRequests)(req, res);
}));
router.delete("/cancel-request", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.cancelFriendRequest)(req, res);
}));
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, friends_1.searchUsers)(req, res);
}));
exports.default = router;
