import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import connectDB from "@/lib/mongodb";
import { UserModel, SessionModel } from "@/lib/models";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;

    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = tokenResponse.data;

    // 2. Get user info from Google
    const googleUser = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userInfo = googleUser.data;

    await connectDB();

    // 3. Create or find user
    let user = await UserModel.findOne({ email: userInfo.email });

    if (!user) {
      user = await UserModel.create({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });
    }

    console.log("UserModel schema:", UserModel.schema.paths);


    // 4. Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await SessionModel.create({
      sessionToken,
      userId: user._id, // Correct: ObjectId
      expiresAt,
    });

    // 5. Set cookie
    cookies().set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // 6. Redirect to dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
  } catch (error: any) {
    console.error("Google OAuth Error:", error.response?.data || error);
    return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
  }
}
