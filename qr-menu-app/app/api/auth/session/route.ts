import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { UserModel, SessionModel } from "@/lib/models";


export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const session = await SessionModel.findOne({ sessionToken });

    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ user: null });
    }

    const user = await UserModel.findById(session.userId);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Safe response
    const safeUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    return NextResponse.json({ user: null });
  }
}


export async function POST() {
  return NextResponse.json(
    { error: "Not allowed. Sessions must be created by the OAuth callback." },
    { status: 403 }
  );
}
