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
const tasks_1 = require("../controllers/tasks");
const router = (0, express_1.Router)();
router.post("/manual", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.createManualTask)(req, res);
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getTasks)(req, res);
}));
router.get("/today", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getTodayTasks)(req, res);
}));
router.get("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getAllTasks)(req, res);
}));
router.post("/ai", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.generateTasksWithAi)(req, res);
}));
router.post("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.saveTasksList)(req, res);
}));
router.get("/analytics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getTaskAnalytics)(req, res);
}));
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTask)(req, res);
}));
router.put("/priority/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTaskPriority)(req, res);
}));
router.put("/completed/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTaskCompleteStatus)(req, res);
}));
router.put("/status/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTaskStatus)(req, res);
}));
router.put("/kanban/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTaskKanban)(req, res);
}));
router.put("/times/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.updateTaskTimes)(req, res);
}));
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.deleteTask)(req, res);
}));
router.post("/byDate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getTasksByDate)(req, res);
}));
router.get("/calendar", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, tasks_1.getCalendarTasks)(req, res);
}));
exports.default = router;
