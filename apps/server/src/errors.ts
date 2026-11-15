// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Errors handlers can throw; the router turns them into status codes. Anything else becomes a generic 500.
import type { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const notFound = (message: string) => new ApiError(404, message);

/** The first problem in plain words: "severity: Number must be less than or equal to 10". */
export function zodMessage(err: ZodError): string {
  const i = err.issues[0];
  if (!i) return "Invalid request";
  return i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message;
}
