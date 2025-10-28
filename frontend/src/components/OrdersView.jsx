import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, ChefHat } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https', 'wss').replace('http', 'ws');

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, preparing, completed

  useEffect(() => {
    fetchOrders();
    
    // Setup WebSocket
    const ws = new WebSocket(`${WS_URL}/ws`);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "new_order") {
        toast.success(`New order from Table ${data.order.table_number}!`);
        fetchOrders();
      } else if (data.type === "order_update") {
        fetchOrders();
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "preparing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "preparing":
        return <ChefHat className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
        <div className="flex space-x-2">
          <Button
            data-testid="filter-all"
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className={filter === "all" ? "bg-slate-900" : ""}
          >
            All
          </Button>
          <Button
            data-testid="filter-pending"
            onClick={() => setFilter("pending")}
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            className={filter === "pending" ? "bg-slate-900" : ""}
          >
            Pending
          </Button>
          <Button
            data-testid="filter-preparing"
            onClick={() => setFilter("preparing")}
            variant={filter === "preparing" ? "default" : "outline"}
            size="sm"
            className={filter === "preparing" ? "bg-slate-900" : ""}
          >
            Preparing
          </Button>
          <Button
            data-testid="filter-completed"
            onClick={() => setFilter("completed")}
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            className={filter === "completed" ? "bg-slate-900" : ""}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} data-testid={`order-card-${order.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Table {order.table_number}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </Badge>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">{item.menu_item_name}</span>
                        <span className="text-slate-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">${order.total.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                {order.status !== "completed" && (
                  <div className="flex space-x-2">
                    {order.status === "pending" && (
                      <Button
                        data-testid={`mark-preparing-${order.id}`}
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <ChefHat className="w-4 h-4 mr-1" />
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        data-testid={`mark-completed-${order.id}`}
                        onClick={() => updateOrderStatus(order.id, "completed")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl">
          <p className="text-slate-500">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </p>
        </div>
      )}
    </div>
  );
}

export default OrdersView;