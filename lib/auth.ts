import { sendNotificationEmail } from "@/action/send-notification";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
  // advanced: {
  //   cookiePrefix: "health-care",
  //   cookies: {
  //     session_token: {
  //       name: "health-care-token",
  //       attributes: {},
  //     },
  //   },
  // },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendNotificationEmail({
        to: user.email,
        subject: "Verify your email address",
        notificationTitle: "Verify your email address",
        notificationContent:
          "Please verify your email address to continue by clicking the link below.",
        actionLink: url,
        appName: "HealthCare",
        userName: user.name,
      });
    },
    autoSignInAfterVerification: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendNotificationEmail({
        to: user.email,
        subject: "Reset your password",
        notificationTitle: "Reset your password",
        notificationContent:
          "Please reset your password by clicking the link below.",
        actionLink: url,
        appName: "HealthCare",
        userName: user.name,
      });
    },
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },
  plugins: [passkey(), twoFactor(), nextCookies()],
});
