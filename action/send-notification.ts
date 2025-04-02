"use server";

import { NotificationTemplate } from "@/components/emails/notification-template";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const NotificationSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  notificationTitle: z.string(),
  notificationContent: z.string(),
  appName: z.string().optional(),
  logoUrl: z.string().optional(),
  userName: z.string().optional(),
  actionLink: z.string().optional(),
  actionText: z.string().optional(),
  supportEmail: z.string().optional(),
  preferencesLink: z.string().optional(),
  companyName: z.string().optional(),
});

type NotificationInput = z.infer<typeof NotificationSchema>;

export async function sendNotificationEmail(input: NotificationInput) {
  try {
    const notificationPayload = NotificationSchema.parse(input);
    const { data, error } = await resend.emails.send({
      from: `${notificationPayload.appName || "HealthCare"} <noreply@glaceandconfort.com>`,
      to: notificationPayload.to,
      subject: notificationPayload.subject,
      react: NotificationTemplate({
        to: notificationPayload.to,
        notificationTitle: notificationPayload.notificationTitle,
        notificationContent: notificationPayload.notificationContent,
        appName: notificationPayload.appName,
        logoUrl: notificationPayload.logoUrl,
        userName: notificationPayload.userName,
        actionLink: notificationPayload.actionLink,
        actionText: notificationPayload.actionText,
        supportEmail: notificationPayload.supportEmail,
        year: new Date().getFullYear(),
      }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending notification email:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        details: error.errors,
      };
    }

    return { success: false, error: "Failed to send email notification" };
  }
}
