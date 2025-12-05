"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Droplet, Bell } from 'lucide-react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useSession, signOut } from "next-auth/react";

let socket;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications(session.user._id);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      socket = io(apiUrl);
      socket.on('connect', () => console.log('Navbar Socket connected'));
      
      if (session.user.role === 'seeker') {
        socket.on('donation-accepted-notification', (data) => {
            if (data.seekerId === session.user._id) {
                setNotifications(prev => [data, ...prev]);
            }
        });
      }
    }
    return () => {
      if (socket) socket.disconnect();
    }
  }, [status, session]);

  const fetchNotifications = async (userId) => {
    try {
      const res = await api.get(`/notifications/${userId}`);
      setNotifications(res.data.filter(n => !n.isRead));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem('user'); // Clean up legacy
    router.push('/login');
  };

  return (
    <nav className="bg-red-600 text-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Droplet className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight">BloodConnect</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
            <Link href="/search" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Find Blood</Link>
            
            {status === 'authenticated' ? (
              <>
                <Link href="/request" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Request Blood</Link>
                <Link href="/dashboard" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
                
                {/* Notification Bell */}
                <div className="relative">
                  <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 hover:bg-red-700 rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-800 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 text-gray-800">
                      <div className="py-2">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-2 text-sm text-gray-500">No new notifications</p>
                        ) : (
                          notifications.map((notif, idx) => (
                            <div key={idx} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                              <p className="text-sm font-medium text-gray-900">{notif.message || (notif.donorName ? `${notif.donorName} accepted request` : 'New Notification')}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt || notif.timestamp).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleLogout} className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</Link>
                <Link href="/register" className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">Register</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-gray-200 focus:outline-none">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-red-700">
            <Link href="/" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Home</Link>
            <Link href="/search" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Find Blood</Link>
            {status === 'authenticated' ? (
              <>
                <Link href="/request" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Request Blood</Link>
                <Link href="/dashboard" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                <button onClick={handleLogout} className="block w-full text-left hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Login</Link>
                <Link href="/register" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
