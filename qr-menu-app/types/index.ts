export interface User {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
}

export interface Session {
  sessionToken: string;
  userId: string; // ObjectId as string
  expiresAt: Date;
}

export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  createdAt: Date;
  ownerId: string; // ObjectId
  category?: string;
}

export interface Table {
  _id: string;
  tableNumber: number;
  tableName: string;
  createdAt: Date;
  ownerId: string; // ObjectId
}

export interface OrderItem {
  menuItemId: string; // ObjectId
  menuItemName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  tableId: string; // ObjectId
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'completed';
  total: number;
  createdAt: Date;
  completedAt?: Date;
  ownerId: string; // ObjectId
}
