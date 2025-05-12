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
exports.getSubscription = getSubscription;
exports.changePlan = changePlan;
exports.changeBillingMode = changeBillingMode;
exports.cancelSubscription = cancelSubscription;
exports.getInvoices = getInvoices;
exports.finalizeInvoice = finalizeInvoice;
exports.getPaymentMethods = getPaymentMethods;
exports.changePaymentMethod = changePaymentMethod;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("../lib/crypto");
const resend_1 = require("../lib/resend");
function getSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const subscription = yield prisma_1.db.subscription.findFirst({
                where: {
                    stripeCustomerId: session.user.stripeCustomerId,
                },
            });
            if (!subscription) {
                return res.status(200).json({
                    message: "No subscription found",
                    success: true,
                });
            }
            return res.status(200).json({
                message: "Subscription retrieved",
                success: true,
                data: subscription,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error retrieving subscription " + error,
                success: false,
            });
        }
    });
}
function changePlan(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const dbSub = yield prisma_1.db.subscription.findFirst({
                where: {
                    stripeCustomerId: session.user.stripeCustomerId,
                },
            });
            if (!dbSub) {
                return res.status(200).json({
                    message: "No subscription found",
                    success: true,
                });
            }
            const id = dbSub.stripeSubscriptionId;
            const { encryptedData } = req.body;
            const data = (0, crypto_1.decryptData)(encryptedData);
            const { billing, price } = data;
            const sub = yield auth_1.stripeClient.subscriptions.retrieve(id);
            const subItemId = sub.items.data[0].id;
            const prices = yield auth_1.stripeClient.prices.list({
                recurring: {
                    interval: billing,
                },
            });
            const planPrice = Number(price) * 100;
            const priceP = prices.data.find((price) => price.unit_amount === planPrice);
            yield auth_1.stripeClient.subscriptions.update(id, {
                items: [
                    {
                        id: subItemId,
                        price: priceP === null || priceP === void 0 ? void 0 : priceP.id,
                    },
                ],
            });
            return res.status(200).json({
                message: "Subscription updated",
                success: true,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error updating subscription " + error,
                success: false,
            });
        }
    });
}
function changeBillingMode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const { encryptedData } = req.body;
            const data = (0, crypto_1.decryptData)(encryptedData);
            const { mode } = data;
            if (!data || !mode || (mode !== "auto" && mode !== "manual")) {
                return res.status(400).json({
                    message: "Billing mode is required",
                    success: false,
                });
            }
            const sub = yield prisma_1.db.subscription.findFirst({
                where: {
                    stripeCustomerId: session.user.stripeCustomerId,
                },
            });
            if (!sub) {
                return res.status(200).json({
                    message: "No subscription found",
                    success: true,
                });
            }
            yield auth_1.stripeClient.subscriptions.update(sub.stripeSubscriptionId, {
                collection_method: mode === "auto" ? "charge_automatically" : "send_invoice",
                days_until_due: mode === "auto" ? undefined : 20,
            });
            yield prisma_1.db.subscription.update({
                where: {
                    id: sub.id,
                },
                data: {
                    autoRenew: mode === "auto",
                },
            });
            (0, resend_1.sendEmail)({
                email: session.user.email,
                subject: session.user.lang === "fr"
                    ? "Mode de facturation mis à jour"
                    : "Billing mode updated",
                html: session.user.lang === "fr"
                    ? "<p>Votre mode de facturation a été mis à jour avec succès.</p>"
                    : "<p>Your billing mode has been successfully updated.</p>",
            });
            return res.status(200).json({
                message: "Subscription updated",
                success: true,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error updating subscription " + error,
                success: false,
            });
        }
    });
}
function cancelSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const sub = yield prisma_1.db.subscription.findFirst({
                where: {
                    stripeCustomerId: session.user.stripeCustomerId,
                },
            });
            if (!sub) {
                return res.status(200).json({
                    message: "No subscription found",
                    success: true,
                });
            }
            const billingSession = yield auth_1.stripeClient.billingPortal.sessions.create({
                customer: session.user.stripeCustomerId,
                return_url: `http://localhost:3000/${session.user.lang}/settings?tab=myplan`,
                locale: session.user.lang,
                flow_data: {
                    type: "subscription_cancel",
                    subscription_cancel: {
                        subscription: sub.stripeSubscriptionId,
                    },
                    after_completion: {
                        type: "redirect",
                        redirect: {
                            return_url: `http://localhost:3000/${session.user.lang}/success?tab=cancelSubscription`,
                        },
                    },
                },
            });
            return res.status(200).json({
                message: "Link generated",
                success: true,
                link: billingSession.url,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error generating link " + error,
                success: false,
            });
        }
    });
}
function getInvoices(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const subscription = yield prisma_1.db.subscription.findFirst({
                where: {
                    stripeCustomerId: session.user.stripeCustomerId,
                },
            });
            if (!subscription) {
                return res.status(200).json({
                    message: "No subscription found",
                    success: true,
                });
            }
            const invoices = yield auth_1.stripeClient.invoices.list({
                customer: session.user.stripeCustomerId,
                subscription: subscription === null || subscription === void 0 ? void 0 : subscription.stripeSubscriptionId,
                limit: 4,
            });
            if (!invoices.data.length) {
                return res.status(200).json({
                    message: "No invoices found",
                    success: true,
                });
            }
            const formattedInvoices = invoices.data.map((invoice) => {
                return {
                    id: invoice.id,
                    amount: invoice.amount_due,
                    paid: invoice.paid,
                    invoicePdf: invoice.invoice_pdf,
                    invoiceUrl: invoice.hosted_invoice_url,
                    created: new Date(invoice.created * 1000),
                };
            });
            return res.status(200).json({
                data: formattedInvoices,
                success: true,
                message: "Invoices retrieved",
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error retrieving subscription " + error,
                success: false,
            });
        }
    });
}
function finalizeInvoice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).json({
                    message: "Invoice ID is required",
                    success: false,
                });
            }
            const invoice = yield auth_1.stripeClient.invoices.retrieve(id);
            if (!invoice) {
                return res.status(200).json({
                    message: "No invoice found",
                    success: true,
                });
            }
            const finalizedInvoice = yield auth_1.stripeClient.invoices.finalizeInvoice(id);
            return res.status(200).json({
                message: "Invoice finalized",
                success: true,
                data: finalizedInvoice.hosted_invoice_url,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error finalizing invoice " + error,
                success: false,
            });
        }
    });
}
function getPaymentMethods(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const customer = (yield auth_1.stripeClient.customers.retrieve(session.user.stripeCustomerId));
            const paymentMethod = yield auth_1.stripeClient.customers.retrievePaymentMethod(session.user.stripeCustomerId, customer.invoice_settings.default_payment_method);
            const formatedCard = {
                id: paymentMethod.id,
                month: (_a = paymentMethod.card) === null || _a === void 0 ? void 0 : _a.exp_month,
                year: (_b = paymentMethod.card) === null || _b === void 0 ? void 0 : _b.exp_year,
                last4: (_c = paymentMethod.card) === null || _c === void 0 ? void 0 : _c.last4,
                brand: (_d = paymentMethod.card) === null || _d === void 0 ? void 0 : _d.brand,
            };
            return res.status(200).json({
                message: "Payment method retrieved",
                success: true,
                data: formatedCard,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error retrieving payment method " + error,
                success: false,
            });
        }
    });
}
function changePaymentMethod(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = (0, node_1.fromNodeHeaders)(req.headers);
        const session = yield auth_1.auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            return res.status(401).send({
                message: "Unauthorized",
                success: false,
            });
        }
        try {
            const checkoutSession = yield auth_1.stripeClient.billingPortal.sessions.create({
                customer: session.user.stripeCustomerId,
                locale: session.user.lang,
                return_url: "http://localhost:3000/en/dashboard",
            });
            return res.status(200).json({
                message: "Payment method updated",
                success: true,
                link: checkoutSession.url,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: "Error updating payment method " + error,
                success: false,
            });
        }
    });
}
