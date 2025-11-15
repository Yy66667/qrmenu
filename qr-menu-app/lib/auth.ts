import { cookies } from 'next/headers';
import { SessionModel, UserModel } from './models';
import connectDB from './mongodb';
import type { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await SessionModel.findOne({ sessionToken });
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = await UserModel.findOne({ id: session.userId });
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function requireAuth(user: User | null): User {
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}