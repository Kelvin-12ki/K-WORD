import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import type { IUser } from "@/models";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface AuthContext {
  userId: string;
  user: IUser;
}

/**
 * Resolves the authenticated user and their DB record, or throws ApiError(401).
 */
export async function requireUser(): Promise<AuthContext> {
  const session = await auth();
  const email = session?.user?.email;
  const id = session?.user?.id;

  if (!session?.user || (!email && !id)) {
    throw new ApiError("Unauthorized", 401);
  }

  await connectDB();

  const filter = id ? { $or: [{ _id: id }, { email: email?.toLowerCase() }] } : { email: email!.toLowerCase() };
  const user = await User.findOne(filter);

  if (!user) {
    throw new ApiError("Account not found. Please sign in again.", 401);
  }

  return { userId: user._id.toString(), user };
}

export function handleApiError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Something went wrong";
  const isValidation =
    typeof err === "object" && err !== null && (err as { name?: string }).name === "ValidationError";
  return Response.json(
    { error: isValidation ? "Invalid data provided" : message },
    { status: isValidation ? 400 : 500 }
  );
}
