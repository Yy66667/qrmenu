import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CustomerMenu() {
  const { tableId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchTableInfo();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data.filter(item => item.available));
    } catch (error) {
      console.error("Error fetching menu:", error);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async () => {
    try {
      const response = await axios.get(`${API}/tables`, {
        withCredentials: true
      });
      const table = response.data.find(t => t.id === tableId);
      setTableInfo(table);
    } catch (error) {
      console.error("Error fetching table info:", error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId, delta) => {
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
      toast.error("Your cart is empty");
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      await axios.post(`${API}/orders`, {
        table_id: tableId,
        items: orderItems
      });

      setOrderPlaced(true);
      toast.success("Order placed successfully!");
      setCart([]);

      // Reset after 3 seconds
      setTimeout(() => {
        setOrderPlaced(false);
      }, 3000);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-4 p-8">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
          <h2 className="text-3xl font-bold text-slate-900">Order Placed!</h2>
          <p className="text-slate-600">Your order has been sent to the kitchen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Menu</h1>
                {tableInfo && (
                  <p className="text-xs text-slate-500">Table {tableInfo.table_number}</p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {cart.length} items
            </Badge>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => (
            <Card key={item.id} data-testid={`menu-item-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {item.image_url && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 h-40">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-lg font-bold text-slate-900">${item.price.toFixed(2)}</p>
                  <Button
                    data-testid={`add-to-cart-${item.id}`}
                    onClick={() => addToCart(item)}
                    className="w-full bg-slate-900 hover:bg-slate-800 rounded-full"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500">No menu items available</p>
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-xl z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-3">
              {/* Cart Items */}
              <div className="max-h-32 overflow-y-auto space-y-2">
                {cart.map(item => (
                  <div key={item.id} data-testid={`cart-item-${item.id}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-2 py-1">
                        <button
                          data-testid={`decrease-qty-${item.id}`}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-slate-900 font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          data-testid={`increase-qty-${item.id}`}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-slate-900 w-16 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Checkout */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-bold text-slate-900">${getTotal().toFixed(2)}</p>
                </div>
                <Button
                  data-testid="place-order-btn"
                  onClick={placeOrder}
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 rounded-full px-8"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Place Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerMenu;