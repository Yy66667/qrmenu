import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { OrderModel, TableModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import crypto from 'crypto';

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    await connectDB();
    const query = status ? { status } : {};
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectDB();

    // Verify table exists
    const table = await TableModel.findOne({ id: body.tableId || body.table_id });
    if (!table) {
      return NextResponse.json({ detail: 'Table not found' }, { status: 404 });
    }

    // Calculate total
    const total = body.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const order = await OrderModel.create({
      id: generateId(),
      tableId: body.tableId || body.table_id,
      tableNumber: table.tableNumber,
      items: body.items.map((item: any) => ({
        menuItemId: item.menuItemId || item.menu_item_id,
        menuItemName: item.menuItemName || item.menu_item_name,
        quantity: item.quantity,
        price: item.price,
      })),
      status: 'pending',
      total,
    });

    // Broadcast new order via Socket.IO
    if (global.io) {
      global.io.emit('new_order', {
        type: 'new_order',
        order: order.toObject(),
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ detail: 'Failed to create order' }, { status: 500 });
  }
}