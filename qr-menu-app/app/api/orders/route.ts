import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OrderModel, TableModel } from "@/lib/models";
import { getCurrentUser, requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = { ownerId: user.id };
    if (status) query.status = status;

    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { detail: error.message === "Unauthorized" ? "Not authenticated" : "Failed to fetch orders" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireAuth(user);

    await connectDB();
    const body = await request.json();

    const tableId = body.tableId || body.table_id;

    // Validate table ownership
    const table = await TableModel.findOne({
      _id: tableId,
      ownerId: user.id,
    });

    if (!table) {
      return NextResponse.json({ detail: "Table not found" }, { status: 404 });
    }

    // Calculate total
    const total = body.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Create order with MongoDB _id
    const order = await OrderModel.create({
      tableId,
      tableNumber: table.tableNumber,

      items: body.items.map((item: any) => ({
        menuItemId: item.menuItemId || item.menu_item_id, // now ObjectId
        menuItemName: item.menuItemName || item.menu_item_name,
        quantity: item.quantity,
        price: item.price,
      })),

      status: "pending",
      total,
      ownerId: user.id,
    });

    // Emit via socket.io
    if (globalThis.io) {
      globalThis.io.emit("new_order", {
        type: "new_order",
        order: order.toObject(),
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { detail: "Failed to create order" },
      { status: 500 }
    );
  }
}
