import { db } from "@/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export async function GET() {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: "unknown",
    cache: "unknown",
  };

  try {
    await db.execute(sql`SELECT 1`);
    health.database = "connected";
  } catch (error) {
    health.database = "disconnected";
    console.error("Database health check failed:", error);
  }

  try {
    if (redis) {
      await redis.ping();
      health.cache = "connected";
    } else {
      health.cache = "not configured";
    }
  } catch (error) {
    health.cache = "disconnected";
    console.error("Redis health check failed:", error);
  }

  const isHealthy = health.database === "connected";

  return Response.json(health, {
    status: isHealthy ? 200 : 503,
  });
}
