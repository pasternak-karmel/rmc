import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  apiAuthPrefix,
  apiPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "./routes";

import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  try {
    const { nextUrl } = request;
    const { pathname } = nextUrl;

    // Check if the user is logged in
    const isLoggedIn = getSessionCookie(request);

    // Identify route types
    const isApiRoute = pathname.startsWith(apiPrefix);
    const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthRoute = authRoutes.includes(pathname);

    if (isApiAuthRoute || isPublicRoute) {
      return NextResponse.next();
    }

    // Handle API routes
    if (isApiRoute) {
      if (!isLoggedIn) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return NextResponse.next();
    }

    // Handle authentication routes
    if (isAuthRoute) {
      if (isLoggedIn) {
        return NextResponse.redirect(
          new URL(DEFAULT_LOGIN_REDIRECT, request.url)
        );
      }
      return NextResponse.next();
    }

    // Protect routes that are not public or authentication routes
    if (!isLoggedIn && !isPublicRoute) {
      const callbackUrl = pathname; // Capture the current path as callback URL
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return NextResponse.redirect(
        new URL(`/auth/sign-in?callbackUrl=${encodedCallbackUrl}`, request.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error in middleware:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|icons/|fonts/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
