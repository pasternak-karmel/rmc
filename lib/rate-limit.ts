import { redis } from "@/lib/redis";
import { type NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  limit: number;
  window: number;
  identifier?: (req: NextRequest) => string;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW = 60;

/**
 * Default identifier function that uses IP address
 */

const defaultIdentifier = (req: NextRequest): string => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("cf-connecting-ip") ||
    "anonymous";
  return `rate-limit:${ip}`;
};

/**
 * Rate limiting middleware for API routes
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {
    limit: DEFAULT_LIMIT,
    window: DEFAULT_WINDOW,
  }
): Promise<NextResponse | null> {
  if (!redis) return null;

  const { limit, window } = config;
  const identifier = config.identifier?.(req) || defaultIdentifier(req);

  try {
    const [response] = await redis
      .pipeline()
      .incr(identifier)
      .expire(identifier, window)
      .exec();

    const currentCount = response || 0;

    const headers = new Headers();
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, limit - currentCount).toString()
    );
    headers.set(
      "X-RateLimit-Reset",
      (Math.floor(Date.now() / 1000) + window).toString()
    );

    if (currentCount > limit) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    return null;
  } catch (error) {
    console.error("Rate limit error:", error);
    return null;
  }
}
