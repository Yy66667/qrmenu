import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MenuItemModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    // User gets only their items
    const items = await MenuItemModel
      .find({ ownerId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /menu error:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.price) {
      return NextResponse.json(
        { detail: 'Name and price are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const item = await MenuItemModel.create({
      name: body.name,
      price: Number(body.price),
      imageUrl: body.imageUrl || body.image_url || null,
      category: body.category || 'Uncategorized',
      available: true,
      ownerId: user.id,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('POST /menu error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { detail: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
