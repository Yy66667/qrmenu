import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MenuItemModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';

/* ------------------------ UPDATE MENU ITEM ------------------------ */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id } = params;

    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;

    // Accept both imageUrl and image_url
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      updateData.imageUrl = body.imageUrl ?? body.image_url;
    }

    if (body.available !== undefined) updateData.available = body.available;
    if (body.category !== undefined) updateData.category = body.category;

    const item = await MenuItemModel.findOneAndUpdate(
      { _id: id, ownerId: user.id },
      { $set: updateData },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ detail: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Update menu item error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { detail: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

/* ------------------------ DELETE MENU ITEM ------------------------ */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const { id } = params;

    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    const result = await MenuItemModel.deleteOne({
      _id: id,
      ownerId: user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error: any) {
    console.error('Delete menu item error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { detail: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
