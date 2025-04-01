"use server";

import { db } from "@/db";
import { patient } from "@/db/schema";
import { count, lt } from "drizzle-orm";

export const statiqueDashboard = async () => {
  const total = await db.select({ count: count() }).from(patient);

  const totalPatient = total[0]?.count || 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const previousWeekPatients = await db
    .select({ count: count() })
    .from(patient)
    .where(lt(patient.createdAt, oneWeekAgo));

  const previousCount = previousWeekPatients[0]?.count || 0;

  return {
    processedCount: totalPatient,
    processedPercentChange:
      ((totalPatient - previousCount) / previousCount) * 100,
  };
};
