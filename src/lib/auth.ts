import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider === "google" && user.email) {
        await connectDB();
        await User.findOneAndUpdate(
          { email: user.email.toLowerCase() },
          {
            $set: {
              name: user.name ?? user.email.split("@")[0],
              image: user.image,
              provider: "google",
            },
            $setOnInsert: {
              email: user.email.toLowerCase(),
              streak: 0,
              totalWords: 0,
              masteredWords: 0,
              favoriteCount: 0,
              xp: 0,
              level: 1,
              customCategories: [],
            },
          },
          { upsert: true, new: true }
        );
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      await connectDB();
      await User.updateOne(
        { email: user.email.toLowerCase() },
        { $setOnInsert: { name: user.name ?? user.email.split("@")[0], image: user.image } },
        { upsert: true }
      );
    },
  },
});
