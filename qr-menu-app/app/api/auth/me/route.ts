import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    return NextResponse.json(
      { detail: "Server error" },
      { status: 500 }
    );
  }
}
