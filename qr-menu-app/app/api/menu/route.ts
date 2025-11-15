import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MenuItemModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import crypto from 'crypto';

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const items = await MenuItemModel.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Get menu error:', error);
    return NextResponse.json({ detail: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const body = await request.json();
    await connectDB();

    const item = await MenuItemModel.create({
      id: generateId(),
      name: body.name,
      price: body.price,
      imageUrl: body.imageUrl || body.image_url,
      available: true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Create menu item error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to create menu item' }, { status: 500 });
  }
}