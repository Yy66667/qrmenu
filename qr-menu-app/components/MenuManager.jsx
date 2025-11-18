import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

// Always force https for Cloudinary URLs
const fixUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return "https://" + url.slice(7);
  return url;
};

function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    imageUrl: "",
    category: "",
    available: true,
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get("/api/menu");
      setMenuItems(response.data);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        imageUrl: fixUrl(data.url),
      }));

      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingItem) {
        await axios.put(
          `/api/menu/${editingItem._id}`,
          { ...formData, price: parseFloat(formData.price) }
        );
        toast.success("Menu item updated");
      } else {
        await axios.post(
          `/api/menu`,
          { ...formData, price: parseFloat(formData.price) }
        );
        toast.success("Menu item added");
      }

      setDialogOpen(false);
      resetForm();
      fetchMenu();
    } catch {
      toast.error("Failed to save menu item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await axios.delete(`/api/menu/${id}`);
      toast.success("Deleted");
      fetchMenu();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Toggle availability using PUT (your backend supports this already)
  const toggleAvailability = async (item) => {
    try {
      await axios.put(`/api/menu/${item._id}`, {
        available: !item.available,
      });

      toast.success("Availability updated");
      fetchMenu();
    } catch {
      toast.error("Failed to update");
    }
  };

  const openDialog = (item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        imageUrl: fixUrl(item.imageUrl),
        available: item.available,
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      imageUrl: "",
      available: true,
    });
    setEditingItem(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Menu Items</h2>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingItem(null);
                  setDialogOpen(true);
                }}
                className="bg-slate-900 text-slate-200 rounded-full"
              >
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </DialogTrigger>


          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non-veg">Non-Veg</SelectItem>
                    <SelectItem value="egg">Egg</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Image Upload</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && <p className="text-sm text-blue-600 mt-1">Uploading…</p>}

                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    className="mt-2 h-32 rounded-lg object-cover"
                  />
                )}
              </div>

              {editingItem && (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, available: checked })
                    }
                  />
                  <Label>Available</Label>
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1 bg-slate-900 text-slate-200">
                  {editingItem ? "Update" : "Add"}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MENU GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item._id} data-testid={`menu-item-card-${item._id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              {item.imageUrl && (
                <Image
                  src={fixUrl(item.imageUrl) || "/placeholder-food.svg"}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                  priority
                />
              )}

              <h3 className="font-semibold text-slate-900">{item.name}</h3>
              <p className="text-slate-600 text-sm capitalize">{item.category}</p>
              <p className="text-lg font-bold text-slate-900">₹{item.price}</p>

              <Button
                onClick={() => toggleAvailability(item)}
                size="sm"
                className={`w-full mt-2 ${
                  item.available
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {item.available ? "Available" : "Unavailable"}
              </Button>

              <div className="flex space-x-2 mt-3">
                <Button onClick={() => openDialog(item)} variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>

                <Button
                  onClick={() => handleDelete(item._id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MenuManager;
