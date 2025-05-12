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
const subscriptions_1 = require("../controllers/subscriptions");
const router = (0, express_1.Router)();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.getSubscription)(req, res);
}));
router.put("/plan", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.changePlan)(req, res);
}));
router.put("/billingMode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.changeBillingMode)(req, res);
}));
router.get("/cancel", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.cancelSubscription)(req, res);
}));
router.get("/invoices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.getInvoices)(req, res);
}));
router.post("/invoices/finalize/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.finalizeInvoice)(req, res);
}));
router.get("/method", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.getPaymentMethods)(req, res);
}));
router.get("/changeMethod", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subscriptions_1.changePaymentMethod)(req, res);
}));
exports.default = router;
