import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { SessionModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (sessionToken) {
      await SessionModel.deleteOne({ sessionToken });
    }

    cookieStore.delete('session_token');

    return NextResponse.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ detail: 'Logout failed' }, { status: 500 });
  }
}