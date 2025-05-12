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
const schedulerPrefs_1 = require("../controllers/schedulerPrefs");
const router = (0, express_1.Router)();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.getSchedulerModes)(req, res);
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.createSchedulerMode)(req, res);
}));
router.put("/preferred/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.setPreferredMode)(req, res);
}));
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.updateSchedulerMode)(req, res);
}));
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.deleteSchedulerMode)(req, res);
}));
router.get("/preferred", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, schedulerPrefs_1.getPreferredMode)(req, res);
}));
exports.default = router;
