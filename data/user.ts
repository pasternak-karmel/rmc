import { user } from "@/db/auth-schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export const getUserByEmail = async (email: string) => {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return users.length > 0 ? users[0] : null;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const users = await db.select().from(user).where(eq(user.id, id)).limit(1);

    return users.length > 0 ? users[0] : null;
  } catch {
    return null;
  }
};
