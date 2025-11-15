import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { v4 as uuidv4 } from 'crypto';
import connectDB from '@/lib/mongodb';
import { UserModel, SessionModel } from '@/lib/models';

function generateUUID() {
  return uuidv4().replace(/-/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('X-Session-ID');

    if (!sessionId) {
      return NextResponse.json({ detail: 'Session ID required' }, { status: 400 });
    }

    // Exchange session_id for user data
    const authResponse = await axios.get(
      'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
      { headers: { 'X-Session-ID': sessionId } }
    );

    if (authResponse.status !== 200) {
      return NextResponse.json({ detail: 'Invalid session' }, { status: 401 });
    }

    const userData = authResponse.data;

    await connectDB();

    // Check if user exists
    let user = await UserModel.findOne({ email: userData.email });

    if (!user) {
      // Create new user
      user = await UserModel.create({
        id: userData.id || generateUUID(),
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      });
    }

    // Create session
    const sessionToken = userData.session_token;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await SessionModel.create({
      sessionToken,
      userId: user.id,
      expiresAt,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
      },
      sessionToken,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { detail: error.response?.data?.detail || 'Invalid session' },
      { status: 401 }
    );
  }
}