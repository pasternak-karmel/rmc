"use server";

import { getUserByEmail } from "@/data/user";
import { auth } from "@/lib/auth";
import { LoginSchema } from "@/schemas";
import { z } from "zod";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email) {
    return { error: "Email does not exist!" };
  }

  const response = await auth.api.signInEmail({
    body: {
      email,
      password,
      callbackUrl,
    },
    asResponse: true,
  });

  if (response.status === 403) {
    return { error: "Please verify your email address" };
  }

  if (!response.ok) {
    return { error: "Invalid email or password" };
  }
  return { success: "logged in" };
};
