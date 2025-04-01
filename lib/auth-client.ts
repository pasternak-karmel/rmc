import { passkeyClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const {
  forgetPassword,
  passkey,
  resetPassword,
  signIn,
  signUp,
  signOut,
  twoFactor,
  useSession,
  sendVerificationEmail,
} = createAuthClient({
  plugins: [
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/auth/verify";
      },
    }),
  ],
});
