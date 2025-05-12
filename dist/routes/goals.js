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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const goals_1 = require("../controllers/goals");
const router = express_1.default.Router();
router.get("/progress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.getUserProgress)(req, res);
}));
router.get("/goals", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.getGoals)(req, res);
}));
router.patch("/goals/:id/progress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.updateGoalProgress)(req, res);
}));
router.post("/streak", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.updateStreak)(req, res);
}));
router.get("/rewards", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.getRewards)(req, res);
}));
router.get("/rewards/unlocked", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.getUnlockedRewards)(req, res);
}));
router.post("/rewards/:id/unlock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.unlockReward)(req, res);
}));
router.post("/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, goals_1.generateGoals)(req, res);
}));
exports.default = router;
