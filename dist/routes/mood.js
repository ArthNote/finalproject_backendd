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
const mood_1 = require("../controllers/mood");
const router = (0, express_1.Router)();
router.get("/today", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mood_1.getTodaysMood)(req, res);
}));
router.get("/history", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mood_1.getMoodHistory)(req, res);
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mood_1.saveMoodEntry)(req, res);
}));
router.get("/date/:date", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mood_1.getMoodByDate)(req, res);
}));
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mood_1.deleteMoodEntry)(req, res);
}));
exports.default = router;
