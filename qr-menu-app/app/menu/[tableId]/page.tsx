// ...existing code...
// Migrated from src/pages/CustomerMenu.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerMenu() {
  const params = useParams();
  const tableId = params.tableId as string;
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchTableInfo();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data.filter((item: any) => item.available));
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async () => {
    try {
      const response = await axios.get('/api/tables', { withCredentials: true });
      const table = response.data.find((t: any) => t.id === tableId);
      setTableInfo(table);
    } catch (error) {
      console.error('Error fetching table info:', error);
    }
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      await axios.post('/api/orders', {
        table_id: tableId,
        items: orderItems,
      });
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
      setCart([]);
      setTimeout(() => {
        setOrderPlaced(false);
      }, 3000);
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* ...UI rendering logic... */}
      {/* You can further refactor the UI as needed */}
    </div>
  );
}
