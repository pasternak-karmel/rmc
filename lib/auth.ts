import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
  emailVerification: {
    sendOnSignUp: true,
    // sendVerificationEmail: async ({ user, url }) => {
    //   //TODO: Implement this
    //   // gonna be implemented later
    //   await sendVerificationEmail(user.email, url);
    // },
    // autoSignInAfterVerification: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // sendResetPassword: async ({ user, url }) => {
    //   // gonna be implemented later
    //   // await sendPasswordResetEmail(user.email, url);
    // },
    // requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      redirectURI: DEFAULT_LOGIN_REDIRECT,
    },
  },
  plugins: [passkey(), twoFactor(), nextCookies()],
});
