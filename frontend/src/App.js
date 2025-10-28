import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CustomerMenu from "./pages/CustomerMenu";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Protected route that allows access if user is authenticated OR if there's a session_id in the hash
function ProtectedRoute({ user, setUser, children }) {
  const location = useLocation();
  const hasSessionId = location.hash && location.hash.includes('session_id=');
  
  if (!user && !hasSessionId) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing setUser={setUser} />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user} setUser={setUser}>
                <Dashboard user={user} setUser={setUser} />
              </ProtectedRoute>
            } 
          />
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;