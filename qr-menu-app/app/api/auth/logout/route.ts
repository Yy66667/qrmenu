import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { SessionModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const cookieStore = cookies(); // ❗ DO NOT AWAIT
    const sessionToken = cookieStore.get('session_token')?.value;

    if (sessionToken) {
      await SessionModel.deleteOne({ sessionToken });
    }

    // Remove cookie
    cookieStore.set('session_token', '', {
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { detail: 'Logout failed' },
      { status: 500 }
    );
  }
}
