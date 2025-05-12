import { CreateEmailResponseSuccess, ErrorResponse, Resend } from "resend";
import cookie from "cookie";
const resend = new Resend(process.env.RESEND_API_KEY || "");

interface EmailResponse {
  data: CreateEmailResponseSuccess | null;
  error: ErrorResponse | null;
  success: boolean;
  message?: string;
}

interface EmailData {
  email: string;
  subject: string;
  html: string;
  req?: Request;
}


export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  const { data: emailData, error } = await resend.emails.send({
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
}
