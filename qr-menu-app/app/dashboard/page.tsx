// Migrated from src/pages/Dashboard.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import MenuManager from '@/components/MenuManager';
import TableManager from '@/components/TableManager';
import OrdersView from '@/components/OrdersView';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [processingAuth, setProcessingAuth] = useState(false);
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleAuth(sessionId);
    } else {
      fetchUser();
    }
  }, [pathname]);

  const handleAuth = async (sessionId: string) => {
    setProcessingAuth(true);
    try {
      const response = await axios.post('/api/auth/session', {}, {
        headers: { 'X-Session-ID': sessionId },
        withCredentials: true,
      });
      setUser(response.data.user);
      window.history.replaceState({}, document.title, '/dashboard');
      toast.success('Welcome! You are now logged in.');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed. Please try again.');
      router.push('/');
    } finally {
      setProcessingAuth(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me', { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      router.push('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  if (processingAuth || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="text-slate-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
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
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="orders" className="relative">
              <span>
                Orders
                {showNotificationDot && (
                  <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="menu">
            <MenuManager />
          </TabsContent>
          <TabsContent value="tables">
            <TableManager />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersView showNotificationDot={showNotificationDot} setShowNotificationDot={setShowNotificationDot} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
