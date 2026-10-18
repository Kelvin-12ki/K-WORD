import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { registerSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    await connectDB();

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      provider: "credentials",
      streak: 0,
      totalWords: 0,
      masteredWords: 0,
      xp: 0,
      level: 1,
    });

    return Response.json(
      { id: user._id.toString(), name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
