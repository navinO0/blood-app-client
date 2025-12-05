"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Droplet, MapPin, Phone, Bell, Mail, MessageSquare, Edit } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../utils/api';
import { registerPush } from '../../utils/push';
import { useSession } from "next-auth/react";

let socket;

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [acceptedDonors, setAcceptedDonors] = useState({}); // Map requestId -> donors
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [notificationAudio, setNotificationAudio] = useState(null);
  const router = useRouter();

  const fetchAcceptedDonors = async (requestId) => {
    try {
      const res = await api.get(`/blood/requests/${requestId}/donors`);
      setAcceptedDonors(prev => ({ ...prev, [requestId]: res.data }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const parsedUser = session.user;
      setUser(parsedUser);
      setEditFormData(parsedUser);
      
      // Initialize notification audio
      const audio = new Audio('/notification.mp3');
      setNotificationAudio(audio);
      
      // Register for Push Notifications
      registerPush(parsedUser._id);

      // Fetch notifications and unread count
      api.get(`/notifications/${parsedUser._id}`).then(res => {
        setNotifications(res.data);
        const unread = res.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      });

      // Initialize Socket.io
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      socket = io(apiUrl);

      if (parsedUser.role === 'donor' || parsedUser.isAvailable) {
        socket.on('blood-request-notification', (data) => {
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Play notification sound
          if (audio) {
            audio.play().catch(err => console.log('Audio play failed:', err));
          }
        });
      }
      
      if (parsedUser.role === 'seeker') {
        socket.on('donation-accepted-notification', (data) => {
           if (data.seekerId === parsedUser._id) {
             setNotifications((prev) => [data, ...prev]);
             setUnreadCount(prev => prev + 1);
             // Refresh accepted donors for this request
             fetchAcceptedDonors(data.requestId);
             // Play notification sound
             if (audio) {
               audio.play().catch(err => console.log('Audio play failed:', err));
             }
           }
        });
      }

      return () => {
        socket.disconnect();
      };
    }
  }, [status, session, router]);

  const handleAcceptRequest = async (notification) => {
    try {
      await api.post('/blood/accept', {
        requestId: notification.requestId || notification.relatedRequestId,
        donorId: user._id,
        donorName: user.name,
      });
      
      // Update notification status in UI
      setNotifications(prev => prev.map(n => 
        n._id === notification._id ? { ...n, status: 'accepted', isRead: true } : n
      ));
      
      // Update unread count
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      alert('You have accepted the request. The seeker will be notified.');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request.');
    }
  };
  
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already
      if (!notification.isRead) {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications(prev => prev.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleAvailability = async () => {
    const newUser = { ...user, isAvailable: !user.isAvailable };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Sync with backend
    try {
        await api.put('/auth/profile', { userId: user._id, isAvailable: newUser.isAvailable });
    } catch (error) {
        console.error("Failed to update availability", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await api.put('/auth/profile', { userId: user._id, ...editFormData });
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setIsEditModalOpen(false);
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update profile.');
    }
  };

  const maskData = (data, type) => {
    if (!data) return '';
    if (type === 'email') {
      const [name, domain] = data.split('@');
      return `${name.substring(0, 2)}***@${domain}`;
    }
    if (type === 'phone') {
      return `${data.substring(0, 2)}******${data.substring(data.length - 2)}`;
    }
    return data;
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Dashboard</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and status.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
                <Edit className="h-4 w-4 mr-1" /> Edit Profile
            </button>
            {user.role === 'seeker' && (
               <div className="flex items-center">
                 <span className="mr-2 text-sm text-gray-600">Available to Donate?</span>
                 <button 
                   onClick={toggleAvailability}
                   className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${user.isAvailable ? 'bg-green-600' : 'bg-gray-200'}`}
                 >
                   <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${user.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>
            )}
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${user.role === 'donor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-400" /> Full name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Droplet className="h-5 w-5 mr-2 text-gray-400" /> Email address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-400" /> Phone number
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.phone}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-400" /> Location
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.location}</dd>
            </div>
            {(user.role === 'donor' || user.isAvailable) && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Droplet className="h-5 w-5 mr-2 text-red-500" /> Blood Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold text-red-600">{user.bloodType}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="text" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input type="text" value={editFormData.location || ''} onChange={e => setEditFormData({...editFormData, location: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                    <select value={editFormData.bloodType || ''} onChange={e => setEditFormData({...editFormData, bloodType: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="">Select Blood Type</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-red-500" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <li className="px-4 py-4 text-gray-500 text-center">No new notifications</li>
          ) : (
            notifications.map((notif, index) => (
              <li 
                key={index} 
                className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notif.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-2 sm:mb-0">
                    {notif.type === 'request_accepted' ? (
                       <>
                        <p className="text-sm font-medium text-green-600 truncate">
                          Request Accepted!
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {notif.message}
                        </p>
                        {/* Trigger fetch if not already loaded */}
                        {notif.relatedRequestId && !acceptedDonors[notif.relatedRequestId] && (
                            <button 
                                onClick={() => fetchAcceptedDonors(notif.relatedRequestId)}
                                className="text-xs text-blue-600 hover:underline mt-1"
                            >
                                View Donor Details
                            </button>
                        )}
                       </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-red-600 truncate">
                          Urgent: {notif.bloodType} Blood Needed
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Location: {notif.location}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt || notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {(user.role === 'donor' || user.isAvailable) && notif.type !== 'request_accepted' && (
                    <button
                      onClick={() => handleAcceptRequest(notif)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Accept
                    </button>
                  )}
                </div>
                
                {/* Accepted Donors List for this notification's request */}
                {notif.relatedRequestId && acceptedDonors[notif.relatedRequestId] && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Willing Donors:</h4>
                        <ul className="space-y-3">
                            {acceptedDonors[notif.relatedRequestId].map(donor => (
                                <li key={donor._id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Email: {maskData(donor.email, 'email')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Phone: {maskData(donor.phone, 'phone')}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <a href={`tel:${donor.phone}`} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200" title="Call">
                                            <Phone className="h-4 w-4" />
                                        </a>
                                        <a href={`mailto:${donor.email}`} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200" title="Email">
                                            <Mail className="h-4 w-4" />
                                        </a>
                                        <a href={`sms:${donor.phone}`} className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200" title="Message">
                                            <MessageSquare className="h-4 w-4" />
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
