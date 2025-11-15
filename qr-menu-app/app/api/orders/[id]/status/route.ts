import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { OrderModel } from '@/lib/models';
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

    const updateData: any = { status: body.status };
    if (body.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const order = await OrderModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ detail: 'Order not found' }, { status: 404 });
    }

    // Broadcast order update via Socket.IO
    if (global.io) {
      global.io.emit('order_update', {
        type: 'order_update',
        order: order.toObject(),
      });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Update order error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to update order' }, { status: 500 });
  }
}