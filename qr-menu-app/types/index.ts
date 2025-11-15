export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
}

export interface Session {
  sessionToken: string;
  userId: string;
  expiresAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  createdAt: Date;
}

export interface Table {
  id: string;
  tableNumber: number;
  qrCodeData: string;
  createdAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'completed';
  total: number;
  createdAt: Date;
  completedAt?: Date;
}