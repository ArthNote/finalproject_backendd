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
const pomodoro_1 = require("../controllers/pomodoro");
const router = (0, express_1.Router)();
router.post("/sessions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pomodoro_1.saveFocusSession)(req, res);
}));
router.get("/sessions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pomodoro_1.getFocusSessions)(req, res);
}));
router.get("/stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pomodoro_1.getFocusSessionStats)(req, res);
}));
exports.default = router;
