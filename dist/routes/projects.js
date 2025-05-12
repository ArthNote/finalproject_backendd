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
const projects_1 = require("../controllers/projects");
const router = (0, express_1.Router)();
// Get all projects with filtering
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, projects_1.getProjects)(req, res);
}));
// Get single project by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, projects_1.getProject)(req, res);
}));
// Create new project
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, projects_1.createProject)(req, res);
}));
// Update project
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, projects_1.updateProject)(req, res);
}));
// Delete project
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, projects_1.deleteProject)(req, res);
}));
exports.default = router;
