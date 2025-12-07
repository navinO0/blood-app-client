"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Droplet, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import api from '../utils/api';
import { useSession, signOut } from "next-auth/react";

let socket;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [adminToast, setAdminToast] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const notifRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const menuButton = event.target.closest('button');
        if (!menuButton || !menuButton.querySelector('svg')) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 const fetchNotifications = async (userId) => {
    try {
      const res = await api.get(`/notifications/${userId}`);
      setNotifications(res.data.filter(n => !n.isRead));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications(session.user._id);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let socketUrl = apiUrl;
      let socketPath = undefined;
      
      try {
        const urlObj = new URL(apiUrl);
        socketUrl = urlObj.origin;
        if (urlObj.pathname && urlObj.pathname.includes('/blood')) {
            socketPath = '/blood/socket.io';
        }
      } catch (e) {
        console.error("Error parsing API URL for socket:", e);
      }

      socket = io(socketUrl, { path: socketPath });
      // Debug logging
      socket.on('connect', () => console.log('Navbar Socket connected:', socket.id));
      socket.on('connect_error', (err) => console.error('Navbar Socket connection error:', err));

      if (session?.user?.role === 'seeker') {
        socket.on('donation-accepted-notification', (data) => {
            console.log('Navbar received donation-accepted:', data);
            if (data.seekerId === session.user._id) {
                setNotifications(prev => [data, ...prev]);
            }
        });
      }

      if (session?.user?.role === 'donor' || session?.user?.isAvailable) {
         socket.on('blood-request-notification', (data) => {
            console.log('Navbar received blood-request:', data);
            setNotifications(prev => [data, ...prev]);
         });
      }

      // Admin Login Toaster Listener
      if (session?.user?.role === 'admin') {
          socket.on('user_logged_in', (data) => {
              console.log('Admin received login event:', data);
              setAdminToast({ 
                  visible: true, 
                  message: `User Logged In: ${data.userName} (${data.role})`,
                  time: new Date().toLocaleTimeString() 
              });
              // Auto hide after 5s
              setTimeout(() => setAdminToast(null), 5000);
          });
      }
    }
    return () => {
      if (socket) socket.disconnect();
    }
  }, [status, session?.user?._id]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem('user'); // Clean up legacy
    router.push('/login');
  };

  return (
    <nav className="bg-red-600 text-white shadow-lg relative z-50">
        {/* Admin Toaster */}
        <AnimatePresence>
            {adminToast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center gap-3 border border-gray-700"
                >
                    <div className="bg-green-500 rounded-full p-1">
                        <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">{adminToast.message}</p>
                        <p className="text-xs text-gray-400">{adminToast.time}</p>
                    </div>
                    <button onClick={() => setAdminToast(null)} className="ml-2 hover:text-gray-300">
                        <X className="h-4 w-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Droplet className="h-8 w-8" />
              </motion.div>
              <span className="font-bold text-xl tracking-tight">BloodConnect</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Home</Link>
            
            {session?.user?.role === 'admin' && (
              <Link href="/search" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Find Blood</Link>
            )}
            
            {status === 'authenticated' ? (
              <>
                {session?.user?.role === 'admin' && (
                  <>
                    <Link href="/request" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Request Blood</Link>
                    <Link href="/admin/create" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Create Admin</Link>
                  </>
                )}
                <Link href="/dashboard" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Dashboard</Link>
                
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <motion.button 
                    onClick={() => setShowNotifs(!showNotifs)} 
                    className="p-2 hover:bg-red-700 rounded-full relative transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bell className="h-5 w-5" />
                    <AnimatePresence>
                      {notifications.length > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-800 rounded-full"
                        >
                          {notifications.length}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  
                  <AnimatePresence>
                    {showNotifs && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 text-gray-800"
                      >
                        <div className="py-2 max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-2 text-sm text-gray-500">No new notifications</p>
                          ) : (
                            notifications.map((notif, idx) => (
                              <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer transition-colors"
                              >
                                <p className="text-sm font-medium text-gray-900">{notif.message || (notif.donorName ? `${notif.donorName} accepted request` : 'New Notification')}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt || notif.timestamp).toLocaleString()}</p>
                                {notif.status && (
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                    notif.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    notif.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    notif.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {notif.status}
                                  </span>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button 
                  onClick={handleLogout} 
                  className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Login</Link>
                <Link href="/register" className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105">Register</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <motion.button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-white hover:text-gray-200 focus:outline-none"
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-red-700">
              <Link href="/" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
              {session?.user?.role === 'admin' && (
                <Link href="/search" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Find Blood</Link>
              )}
              {status === 'authenticated' ? (
                <>
                  {session?.user?.role === 'admin' && (
                    <>
                      <Link href="/request" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Request Blood</Link>
                      <Link href="/admin/create" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Create Admin</Link>
                    </>
                  )}
                  <Link href="/dashboard" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-left hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Login</Link>
                  <Link href="/register" className="block hover:bg-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors">Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
