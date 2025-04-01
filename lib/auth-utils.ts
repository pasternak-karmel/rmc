import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

/**
 * Get the authenticated user from the request
 * @throws {ApiError} If user is not authenticated
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session || !session.user) {
    throw ApiError.unauthorized(
      "You must be logged in to access this resource"
    );
  }

  return session.user;
}

/**
 * Check if the user has the required role
 * @throws {ApiError} If user doesn't have the required role
 */
export async function checkUserRole(req: NextRequest, requiredRole: string) {
  const user = await getAuthenticatedUser(req);

  console.log(requiredRole);

  //   const userRoles = user.roles || [];

  //   if (!userRoles.includes(requiredRole)) {
  //     throw ApiError.forbidden(
  //       "You do not have permission to access this resource"
  //     );
  //   }

  return user;
}
