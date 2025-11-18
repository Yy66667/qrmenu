import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, QrCode, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function TableManager() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

 const fetchTables = async () => {
  try {
    const response = await axios.get("/api/tables");

    const normalized = response.data.map((table) => ({
      id: table._id,
      table_number: table.tableNumber,
      table_name: table.tableName,
      created_at: table.createdAt,
      qr_code_data: table.qrCodeData,
    }));

    setTables(normalized);
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
     await axios.post("/api/tables", {
          tableNumber: parseInt(tableNumber),
          tableName: tableName || "Table"
        });

      toast.success("Table created");
      setDialogOpen(false);
      setTableNumber("");
      setTableName("");
      fetchTables();
    } catch (error) {
      console.error("Error creating table:", error);
      if (error.response?.status === 400) {
        toast.error("Table name and number combination already exists");
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
      const response = await axios.get(`/api/tables/${tableId}?action=qr`, {
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
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Tables & QR Codes</h2>
         
        </div>
        
         <div className="flex items-center justify-between">
           <Button
            variant="outline"
            
            className="bg-slate-900 text-slate-200 hover:bg-slate-100 mr-4 hover:text-slate-800 rounded-full"
            onClick={async () => {
              try {
                const res = await fetch("/api/tables/qr-bulk");
                if (!res.ok) throw new Error("Failed to download");
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "all-table-qr.zip";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert("Download failed");
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-table-btn"
              className="bg-slate-900 text-slate-200 hover:bg-slate-100 hover:text-slate-800 rounded-full"
            >
              <Plus className="w-4 h-4 mr-0" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-200">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="table_name">Table Name</Label>
                <Input
                  id="table_name"
                  data-testid="table-name-input"
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Table"
                />
              </div>
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
                <Button type="submit" data-testid="save-table-btn" className="flex-1 text-slate-100 bg-slate-900 hover:bg-slate-800">
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
      </header>
     

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.id} data-testid={`table-card-${table._id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{table.table_name || "Table"} {table.table_number}</h3>
                    <p className="text-xs text-slate-500 mt-1">ID: {table.id.slice(0,8)}...</p>
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
            className="bg-slate-900 text-slate-200 hover:bg-slate-800 rounded-full"
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