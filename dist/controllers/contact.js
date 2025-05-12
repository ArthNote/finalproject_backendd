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
exports.sentContactEmail = void 0;
const resend_1 = require("../lib/resend");
const sentContactEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, message } = req.body;
        if (!email || !name || !message) {
            return res.status(400).json({
                message: "All fields are required",
                success: false,
            });
        }
        const response = yield (0, resend_1.sendEmail)({
            email: "taehyungykim10@gmail.com",
            subject: "Want to contact you, from " + name,
            html: `
        <h1>Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
        });
        if (!response.success) {
            return res.status(500).json({
                message: "Error sending email",
                success: false,
                error: response.error,
            });
        }
        return res.status(200).json({
            message: "Email sent successfully",
            success: true,
        });
    }
    catch (error) {
        console.error("Error sending contact email:", error);
        return res.status(500).json({
            message: "Error sending contact email",
            success: false,
            error: error,
        });
    }
});
exports.sentContactEmail = sentContactEmail;
