export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }

  static badRequest(message = "Bad Request") {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not Found") {
    return new ApiError(404, message);
  }

  static methodNotAllowed(message = "Method Not Allowed") {
    return new ApiError(405, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  static internalServer(message = "Internal Server Error") {
    return new ApiError(500, message);
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error && typeof error === "object" && "issues" in error) {
    return Response.json(
      { error: "Validation Error", details: error.issues },
      { status: 400 }
    );
  }

  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}
