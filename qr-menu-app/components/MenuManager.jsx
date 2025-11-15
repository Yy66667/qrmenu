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

function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    available: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get("/api/menu");
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu:", error);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingItem) {
        await axios.put(
          `/api/menu/${editingItem.id}`,
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
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast.error("Failed to save menu item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`/api/menu/${id}`);
      toast.success("Menu item deleted");
      fetchMenu();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        image_url: item.image_url || "",
        available: item.available
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      image_url: "",
      available: true
    });
    setEditingItem(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Menu Items</h2>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-menu-item-btn"
              onClick={() => openDialog()}
              className="bg-slate-900 hover:bg-slate-800 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  data-testid="menu-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  data-testid="menu-price-input"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  data-testid="menu-image-input"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {editingItem && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    data-testid="menu-available-switch"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                  />
                  <Label htmlFor="available">Available</Label>
                </div>
              )}
              <div className="flex space-x-2">
                <Button type="submit" data-testid="save-menu-item-btn" className="flex-1 bg-slate-900 hover:bg-slate-800">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item.id} data-testid={`menu-item-card-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-lg font-bold text-slate-900">${item.price.toFixed(2)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    data-testid={`edit-menu-item-${item.id}`}
                    onClick={() => openDialog(item)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    data-testid={`delete-menu-item-${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl">
          <p className="text-slate-500 mb-4">No menu items yet</p>
          <Button
            data-testid="add-first-menu-item-btn"
            onClick={() => openDialog()}
            className="bg-slate-900 hover:bg-slate-800 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      )}
    </div>
  );
}

export default MenuManager;