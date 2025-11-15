import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, QrCode, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

function TableManager() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get("/api/tables");
      setTables(response.data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tableNumber) {
      toast.error("Please enter a table number");
      return;
    }

    try {
      await axios.post(
        `/api/tables`,
        { table_number: parseInt(tableNumber) }
      );
      toast.success("Table created");
      setDialogOpen(false);
      setTableNumber("");
      fetchTables();
    } catch (error) {
      console.error("Error creating table:", error);
      if (error.response?.status === 400) {
        toast.error("Table number already exists");
      } else {
        toast.error("Failed to create table");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;

    try {
      await axios.delete(`/api/tables/${id}`);
      toast.success("Table deleted");
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Failed to delete table");
    }
  };

  const downloadQR = async (tableId, tableNum) => {
    try {
      const response = await axios.get(`/api/tables/${tableId}/qr`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table-${tableNum}-qr.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("QR code downloaded");
    } catch (error) {
      console.error("Error downloading QR:", error);
      toast.error("Failed to download QR code");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Tables & QR Codes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-table-btn"
              className="bg-slate-900 hover:bg-slate-800 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="table_number">Table Number *</Label>
                <Input
                  id="table_number"
                  data-testid="table-number-input"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" data-testid="save-table-btn" className="flex-1 bg-slate-900 hover:bg-slate-800">
                  Create Table
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.id} data-testid={`table-card-${table.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Table {table.table_number}</h3>
                    <p className="text-xs text-slate-500 mt-1">ID: {table.id.slice(0, 8)}...</p>
                  </div>
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-600" />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    data-testid={`download-qr-${table.id}`}
                    onClick={() => downloadQR(table.id, table.table_number)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download QR
                  </Button>
                  <Button
                    data-testid={`delete-table-${table.id}`}
                    onClick={() => handleDelete(table.id)}
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

      {tables.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl">
          <p className="text-slate-500 mb-4">No tables yet</p>
          <Button
            data-testid="add-first-table-btn"
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Table
          </Button>
        </div>
      )}
    </div>
  );
}

export default TableManager;