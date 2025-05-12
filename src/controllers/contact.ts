import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../lib/prisma";
import { sendEmail } from "../lib/resend";

export const sentContactEmail = async (req: Request, res: Response) => {
  try {
    const { email, name, message } = req.body;

    if (!email || !name || !message) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const response = await sendEmail({
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
  } catch (error) {
    console.error("Error sending contact email:", error);
    return res.status(500).json({
      message: "Error sending contact email",
      success: false,
      error: error,
    });
  }
};
