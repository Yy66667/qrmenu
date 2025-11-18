import { Schema, model, models } from 'mongoose';

/* --------------------- USER --------------------- */
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: String,
}, { timestamps: true });

/* --------------------- SESSION --------------------- */
const SessionSchema = new Schema({
  sessionToken: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

/* --------------------- MENU ITEM --------------------- */
const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: String,
  available: { type: Boolean, default: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: String,
}, { timestamps: true });

/* --------------------- TABLE --------------------- */
const TableSchema = new Schema({
  tableNumber: { type: Number, required: true },
  tableName: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Ensure each restaurant cannot duplicate table + name
TableSchema.index(
  { tableNumber: 1, tableName: 1, ownerId: 1 },
  { unique: true }
);

/* --------------------- ORDER --------------------- */
const OrderSchema = new Schema({
  tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
  tableNumber: { type: Number, required: true },

  items: [
    {
      menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
      menuItemName: String,
      quantity: Number,
      price: Number,
    },
  ],

  status: {
    type: String,
    enum: ["pending", "preparing", "completed"],
    default: "pending",
  },

  total: { type: Number, required: true },
  completedAt: Date,

  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

/* --------------------- EXPORT MODELS --------------------- */
export const UserModel = models.User || model("User", UserSchema);
export const SessionModel = models.Session || model("Session", SessionSchema);
export const MenuItemModel = models.MenuItem || model("MenuItem", MenuItemSchema);
export const TableModel = models.Table || model("Table", TableSchema);
export const OrderModel = models.Order || model("Order", OrderSchema);
