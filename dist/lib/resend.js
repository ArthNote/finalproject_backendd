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
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || "");
function sendEmail(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: emailData, error } = yield resend.emails.send({
            from: "taskflow. <onboarding@resend.dev>",
            to: [data.email],
            subject: data.subject,
            html: data.html,
        });
        if (error) {
            console.error("Error sending emails: ", error);
            return {
                data: null,
                error: error,
                success: false,
                message: "Error sending emailaa",
            };
        }
        console.log("Email sent successfully: ", emailData);
        return {
            data: emailData,
            error: null,
            success: true,
            message: "Email sent successfully",
        };
    });
}
