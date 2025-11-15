import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TableModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import crypto from 'crypto';

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();
    const tables = await TableModel.find().sort({ tableNumber: 1 });
    return NextResponse.json(tables);
  } catch (error: any) {
    console.error('Get tables error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    const body = await request.json();
    await connectDB();

    // Check if table number exists
    const existing = await TableModel.findOne({ tableNumber: body.tableNumber || body.table_number });
    if (existing) {
      return NextResponse.json({ detail: 'Table number already exists' }, { status: 400 });
    }

    const tableId = generateId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeData = `${appUrl}/menu/${tableId}`;

    const table = await TableModel.create({
      id: tableId,
      tableNumber: body.tableNumber || body.table_number,
      qrCodeData,
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    console.error('Create table error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to create table' }, { status: 500 });
  }
}