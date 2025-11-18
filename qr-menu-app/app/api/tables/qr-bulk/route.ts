import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TableModel } from '@/lib/models';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const tables = await TableModel.find();

    if (!tables || tables.length === 0) {
      return NextResponse.json({ detail: 'No tables found' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const table of tables) {
      const qrBuffer = await QRCode.toBuffer(table.qrCodeData, {
        type: 'png',
        width: 300,
        margin: 2,
      });

      zip.file(`table-${table.tableNumber}-qr.png`, qrBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="all-table-qr.zip"',
      },
    });
  } catch (error) {
    console.error('Bulk QR error:', error);
    return NextResponse.json({ detail: 'Failed to generate QR codes' }, { status: 500 });
  }
}
