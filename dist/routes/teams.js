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
const teams_1 = require("../controllers/teams");
const router = (0, express_1.Router)();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, teams_1.getTeam)(req, res);
}));
router.post("/resource", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, teams_1.createResource)(req, res);
}));
router.delete("/resource/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, teams_1.deleteResource)(req, res);
}));
exports.default = router;
