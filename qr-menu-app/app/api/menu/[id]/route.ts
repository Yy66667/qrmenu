import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MenuItemModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      updateData.imageUrl = body.imageUrl || body.image_url;
    }
    if (body.available !== undefined) updateData.available = body.available;

    const item = await MenuItemModel.findOneAndUpdate(
      { id },
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
    return NextResponse.json({ detail: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const { id } = await params;
    await connectDB();

    const result = await MenuItemModel.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error: any) {
    console.error('Delete menu item error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to delete menu item' }, { status: 500 });
  }
}