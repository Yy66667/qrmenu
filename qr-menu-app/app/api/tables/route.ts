import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TableModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';

async function handler(request: NextRequest, method: string) {
  const user = await getCurrentUser();
  requireAuth(user);

  if (!user?.id) {
    return NextResponse.json({ detail: 'User not found' }, { status: 401 });
  }

  await connectDB();

  if (method === "GET") {
    const tables = await TableModel.find({ ownerId: user.id }).sort({ tableNumber: 1 });
    return NextResponse.json(tables);
  }

  if (method === "POST") {
    const body = await request.json();

    const exists = await TableModel.findOne({
      tableNumber: body.tableNumber,
      tableName: body.tableName,
      ownerId: user.id,
    });

    if (exists) {
      return NextResponse.json({ detail: 'Table exists' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const table = await TableModel.create({
      tableNumber: body.tableNumber,
      tableName: body.tableName,
      ownerId: user.id,
    });

    return NextResponse.json(table, { status: 201 });
  }

  return NextResponse.json({ detail: "Method not allowed" }, { status: 405 });
}

export async function GET(req: NextRequest) {
  return handler(req, "GET");
}

export async function POST(req: NextRequest) {
  return handler(req, "POST");
}
