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
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("./prisma");
const gameprogress_1 = require("./gameprogress");
const goalGenerator_1 = require("./goalGenerator");
const gameProgress = new gameprogress_1.GameProgress();
node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.db.user.findMany({
            select: { id: true },
        });
        for (const user of users) {
            yield gameProgress.updateStreak(user.id);
            yield (0, goalGenerator_1.checkAndGenerateGoals)(user.id);
        }
        console.log("Daily cron job completed successfully");
    }
    catch (error) {
        console.error("Error in daily cron job:", error);
    }
}));
node_cron_1.default.schedule("0 0 * * 0", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.db.user.findMany({
            select: { id: true },
        });
        for (const user of users) {
            yield (0, goalGenerator_1.checkAndGenerateGoals)(user.id);
        }
        console.log("Weekly cron job completed successfully");
    }
    catch (error) {
        console.error("Error in weekly cron job:", error);
    }
}));
node_cron_1.default.schedule("0 0 1 * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.db.user.findMany({
            select: { id: true },
        });
        for (const user of users) {
            yield (0, goalGenerator_1.checkAndGenerateGoals)(user.id);
        }
        console.log("Monthly cron job completed successfully");
    }
    catch (error) {
        console.error("Error in monthly cron job:", error);
    }
}));
