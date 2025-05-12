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
const messages_1 = require("../controllers/messages");
const router = (0, express_1.Router)();
router.get("/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, messages_1.getMessages)(req, res);
}));
router.post("/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, messages_1.sendMessage)(req, res);
}));
router.patch("/:messageId/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, messages_1.updateMessageStatus)(req, res);
}));
router.get("/:chatId/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, messages_1.searchMessages)(req, res);
}));
router.delete("/:messageId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, messages_1.deleteMessage)(req, res);
}));
exports.default = router;
