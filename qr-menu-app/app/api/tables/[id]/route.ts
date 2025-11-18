import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { TableModel } from "@/lib/models";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    // Query using MongoDB _id
    const table = await TableModel.findOne({ _id: id, ownerId: user.id });

    if (!table) {
      return NextResponse.json(
        { detail: "Table not found" },
        { status: 404 }
      );
    }

    // Generate QR
    if (action === "qr") {
      const qrBuffer = await QRCode.toBuffer(process.env.NEXT_PUBLIC_BASE_URL + "/menu/" + table.id, {
        type: "png",
        width: 300,
        margin: 2,
      });

      const name = table.tableName || "Table";

      return new NextResponse(qrBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${name}-${table.tableNumber}-qr.png"`,
        },
      });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Get table error:", error);
    return NextResponse.json(
      { detail: "Failed to fetch table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    // Delete using _id
    const result = await TableModel.deleteOne({ _id: id, ownerId: user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { detail: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Table deleted" });
  } catch (error: any) {
    console.error("Delete table error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { detail: "Failed to delete table" },
      { status: 500 }
    );
  }
}
