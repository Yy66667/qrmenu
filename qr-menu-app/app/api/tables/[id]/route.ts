import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TableModel } from '@/lib/models';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    await connectDB();
    const table = await TableModel.findOne({ id });

    if (!table) {
      return NextResponse.json({ detail: 'Table not found' }, { status: 404 });
    }

    if (action === 'qr') {
      // Generate QR code
      const qrBuffer = await QRCode.toBuffer(table.qrCodeData, {
        type: 'png',
        width: 300,
        margin: 2,
      });

      return new NextResponse(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="table-${table.tableNumber}-qr.png"`,
        },
      });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Get table error:', error);
    return NextResponse.json({ detail: 'Failed to fetch table' }, { status: 500 });
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

    const result = await TableModel.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Table deleted' });
  } catch (error: any) {
    console.error('Delete table error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ detail: 'Failed to delete table' }, { status: 500 });
  }
}