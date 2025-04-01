import { account } from "@/db/auth-schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export const getAccountByUserId = async (userId: string) => {
  try {
    const [accounts] = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    return accounts;
  } catch {
    return null;
  }
};
