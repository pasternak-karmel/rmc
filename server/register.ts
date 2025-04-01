"use server";

import { getUserByEmail } from "@/data/user";
import { auth } from "@/lib/auth";
import { RegisterSchema } from "@/schemas";
import { z } from "zod";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (existingUser) return { error: "Email already used" };

  // Create user
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
    asResponse: true,
  });

  if (!response.ok) {
    return { error: "Error creating user, please try again" };
  }

  return { success: "Registered successfully" };
};
