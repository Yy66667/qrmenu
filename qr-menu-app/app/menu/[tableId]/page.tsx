"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List } from "lucide-react";
import {
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function CustomerMenu() {
  const params = useParams();
  const tableId = params.tableId as string;
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchTableInfo();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get("/api/menu");

      // Only show available items
      setMenuItems(response.data.filter((item: any) => item.available));
    } catch (error) {
      console.error("Error fetching menu:", error);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async () => {
    try {
      const response = await axios.get("/api/tables");
      const table = response.data.find((t: any) => t._id === tableId);
      setTableInfo(table);
    } catch (error) {
      console.error("Error fetching table info:", error);
    }
  };

  const addToCart = (item: any) => {
    const existing = cart.find((i) => i.id === item.id);

    if (existing) {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }

    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error("Your cart is empty");

    try {
      const orderItems = cart.map((item) => ({
        menu_item_id: item._id,
        menu_item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await axios.post("/api/orders", { table_id: tableId, items: orderItems });

      setOrderPlaced(true);
      setCart([]);
      toast.success("Order placed successfully!");

      setTimeout(() => setOrderPlaced(false), 2500);
    } catch (error) {
      toast.error("Failed to place order");
    }
  };

  // 🔥 Category Badge (Veg/Non-veg styling)
  const CategoryBadge = ({ category }: { category: string }) => {
    if (!category)
      return <Badge variant="secondary" className="text-xs">Item</Badge>;

    const isVeg = category.toLowerCase() === "veg";
    const isNonVeg = category.toLowerCase() === "non-veg";

    if (isVeg)
      return (
        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-green-100/60 text-green-800">
          🟢 Veg
        </Badge>
      );

    if (isNonVeg)
      return (
        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-red-100/60 text-red-800">
          🔴 Non-Veg
        </Badge>
      );

    return <Badge variant="secondary" className="text-xs">{category}</Badge>;
  };

  const filteredMenu =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter(
          (i) => i.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 pb-32">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            {tableInfo ? `Table ${tableInfo.tableNumber}` : "Menu"}
          </h1>

          <div className="flex items-center justify-between">
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="rounded-lg bg-gray-200 text-black flex items-center"
              variant="outline"
            >
              {viewMode === "grid" ? (
                <List className="w-12" />
              ) : (
                <LayoutGrid className="w-8 h-8" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* LOADER */}
      {loading && (
        <div className="flex justify-center py-32">
          <UtensilsCrossed className="animate-spin w-10 h-10 text-blue-600" />
        </div>
      )}

      {!loading && (
        <div className="px-4 py-4 space-y-6">
          {/* CATEGORY HEADER (Future-proof) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {["All", "Veg", "Non-Veg", "Other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium border 
                      ${
                        selectedCategory === cat
                          ? "bg-black text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* MENU LIST */}
          <div className="grid grid-cols-1 gap-5">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-5"
                      : "flex flex-col gap-4"
                  }
                >
                  {filteredMenu.map((item) =>
                    viewMode === "grid" ? (
                      /* ---------------- GRID VIEW (your original) ---------------- */
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
                      >
                        {/* IMAGE */}
                        <div className="h-40 w-full bg-slate-100">
                          <Image
                            src={item.imageUrl || "/placeholder-food.svg"}
                            alt={item.name}
                            width={400}
                            height={160}
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholder-food.svg")
                            }
                            priority
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <h2 className="text-slate-900 font-semibold text-base leading-tight">
                              {item.name}
                            </h2>
                            <CategoryBadge category={item.category} />
                          </div>

                          <p className="text-lg font-bold text-slate-800">
                            ₹ {item.price}
                          </p>

                          <Button
                            className="w-full rounded-xl py-5 text-base font-medium bg-blue-600 hover:bg-blue-700"
                            onClick={() => addToCart(item)}
                          >
                            {cart.find((i) => i.id === item.id)
                              ? `Add More (Qty: ${
                                  cart.find((i) => i.id === item.id)?.quantity
                                })`
                              : "Add to Cart"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ---------------- LIST VIEW (rectangle — image left) ---------------- */
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all p-3 flex gap-4 items-center"
                      >
                        {/* IMAGE */}
                        <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={item.imageUrl || "/placeholder-food.svg"}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholder-food.svg")
                            }
                            priority
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="flex flex-col justify-between w-full">
                          <div className="flex justify-between items-start">
                            <h2 className="text-slate-900 font-semibold text-base">
                              {item.name}
                            </h2>
                            <CategoryBadge category={item.category} />
                          </div>

                          <p className="text-lg font-bold text-slate-800">
                            ₹ {item.price}
                          </p>

                          <Button
                            className="w-full rounded-lg py-2 bg-blue-600 hover:bg-blue-700"
                            onClick={() => addToCart(item)}
                          >
                            {cart.find((i) => i.id === item.id)
                              ? `Add More (Qty: ${
                                  cart.find((i) => i.id === item.id)?.quantity
                                })`
                              : "Add to Cart"}
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          className="rounded-full px-6 py-5 shadow-xl bg-black text-white text-base"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="mr-2" />
          {`Cart (${cart.length})`}
        </Button>
      </div>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="w-80 bg-white h-full p-6 shadow-xl animate-slide-left border-l border-slate-200 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Your Order</h2>

            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 && (
                <p className="text-center text-slate-500 mt-10">Cart is empty</p>
              )}

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-4 flex justify-between items-center bg-slate-50"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-slate-600">₹ {item.price}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="font-bold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="py-4 border-t">
              <p className="text-lg font-semibold">Total: ₹ {getTotal()}</p>
            </div>

            <Button
              className="w-full py-5 mb-2 rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={placeOrder}
              disabled={cart.length === 0}
            >
              Place Order
            </Button>

            <Button
              variant="ghost"
              className="w-full py-4 rounded-xl"
              onClick={() => setShowCart(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {orderPlaced && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 />
          Order Placed!
        </div>
      )}
    </div>
  );
}
