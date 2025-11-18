// Migrated from src/pages/Landing.jsx
// Next.js page component for landing
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleAuth(sessionId);
    }
  }, []);

  const handleAuth = async (sessionId: string) => {
    try {
      const response = await axios.post('/api/auth/session', {}, {
        headers: { 'X-Session-ID': sessionId },
        withCredentials: true,
      });
      // Assume response.data.user exists
      window.history.replaceState({}, document.title, '/dashboard');
      router.push('/dashboard');
      toast.success('Welcome! You are now logged in.');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed. Please try again.');
      window.history.replaceState({}, document.title, '/');
    }
  };

const handleLogin = () => {
  window.location.href = "/api/auth/google/login";
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              QR Menu Platform
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Streamline your restaurant operations with digital menus and real-time order notifications
            </p>
          </div>
          <div className="pt-4">
            <Button
              data-testid="google-login-btn"
              onClick={handleLogin}
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
            >
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
