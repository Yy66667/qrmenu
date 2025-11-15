import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: String,
  createdAt: { type: Date, default: Date.now },
});

const SessionSchema = new Schema({
  sessionToken: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const MenuItemSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const TableSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tableNumber: { type: Number, required: true, unique: true },
  qrCodeData: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tableId: { type: String, required: true },
  tableNumber: { type: Number, required: true },
  items: [
    {
      menuItemId: String,
      menuItemName: String,
      quantity: Number,
      price: Number,
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'completed'],
    default: 'pending',
  },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

export const UserModel = models.User || model('User', UserSchema);
export const SessionModel = models.Session || model('Session', SessionSchema);
export const MenuItemModel = models.MenuItem || model('MenuItem', MenuItemSchema);
export const TableModel = models.Table || model('Table', TableSchema);
export const OrderModel = models.Order || model('Order', OrderSchema);