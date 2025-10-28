import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import MenuManager from "../components/MenuManager";
import TableManager from "../components/TableManager";
import OrdersView from "../components/OrdersView";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu");

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">QR Menu Admin</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Button
                data-testid="logout-btn"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
            <TabsTrigger value="menu" data-testid="menu-tab" className="rounded-lg">
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="tables" data-testid="tables-tab" className="rounded-lg">
              Tables & QR
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab" className="rounded-lg">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" data-testid="menu-content">
            <MenuManager />
          </TabsContent>

          <TabsContent value="tables" data-testid="tables-content">
            <TableManager />
          </TabsContent>

          <TabsContent value="orders" data-testid="orders-content">
            <OrdersView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default Dashboard;