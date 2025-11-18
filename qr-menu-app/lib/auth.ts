import { cookies } from "next/headers";
import { SessionModel, UserModel } from "./models";
import connectDB from "./mongodb";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const sessionToken =  cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    // Find session
    const session = await SessionModel.findOne({ sessionToken }).lean();
    if (!session) return null;

    // Expired session cleanup
    if (session.expiresAt < new Date()) {
      await SessionModel.deleteOne({ sessionToken });
      return null;
    }

    // Load user
    const user = await UserModel.findById(session.userId).lean();
    if (!user) return null;

    // Return normalized user object
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture || undefined,
      createdAt: new Date(user.createdAt),
    };
  } catch (err) {
    console.error("getCurrentUser Error:", err);
    return null;
  }
}

export function requireAuth(user: User | null): User {
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
