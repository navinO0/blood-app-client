"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Droplet, MapPin, Phone, Bell, Mail, MessageSquare, Edit, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [expandedNotifications, setExpandedNotifications] = useState({}); // Track which notifications are expanded
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false); // New state for forced completion
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
      // Optimistically set user from session, but don't check validity yet
      setUser(session.user);
      setEditFormData(session.user);

      // Fetch fresh user data from backend to ensure we have the latest details
      // This fixes the issue where session is stale after profile update
      api.get('/auth/me')
        .then(res => {
          const freshUser = res.data;
          setUser(freshUser);
          setEditFormData(freshUser);

          // Check for missing details using FRESH data
          if (!freshUser.phone || !freshUser.location || !freshUser.bloodType) {
            setIsCompletionModalOpen(true);
          } else {
            setIsCompletionModalOpen(false);
          }

          // Register for Push Notifications
          registerPush(freshUser._id);

          // Fetch notifications and unread count
          return api.get(`/notifications/${freshUser._id}`);
        })
        .then(res => {
          if (res) {
            setNotifications(res.data);
            const unread = res.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
          }
        })
        .catch(err => {
          console.error("Failed to fetch fresh user data:", err);
          // Fallback to session check if API fails? 
          // Better to rely on what we have or retry. 
        });
      
      // Initialize notification audio
      const audio = new Audio('/notification.mp3');
      setNotificationAudio(audio);

      // Initialize Socket.io
      // Initialize Socket.io
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
      
      const parsedUser = session.user; // Use session user for socket logic initially

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
        // Fetch My Requests
        api.get('/blood/my-requests').then(res => setMyRequests(res.data)).catch(err => console.error(err));

        socket.on('donation-accepted-notification', (data) => {
           if (data.seekerId === parsedUser._id) {
             setNotifications((prev) => [data, ...prev]);
             setUnreadCount(prev => prev + 1);
             // Refresh accepted donors for this request
             fetchAcceptedDonors(data.requestId);
             // Refresh my requests to show updated status
             api.get('/blood/my-requests').then(res => setMyRequests(res.data)).catch(err => console.error(err));
             
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
  }, [status, session?.user?._id]);

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

  const handleConfirmDonation = async (donorId, requestId) => {
      if (!window.confirm("Are you sure you want to confirm that this donor has donated blood? This will mark them as unavailable.")) return;

      try {
          await api.post('/blood/confirm-donation', { donorId, requestId });
          alert("Donation confirmed successfully!");
          // Refresh donors list to reflect changes (e.g. check availability or last donated date)
          fetchAcceptedDonors(requestId);
      } catch (error) {
          console.error("Error confirming donation:", error);
          alert("Failed to confirm donation.");
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
        const updatedUser = res.data;
        setUser(updatedUser);
        
        setIsEditModalOpen(false);
        // Check if completion modal can be closed
        if (updatedUser.phone && updatedUser.location && updatedUser.bloodType) {
            setIsCompletionModalOpen(false);
        }
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update profile.');
    }
  };
  
  const handleCompletionSubmit = async (e) => {
      e.preventDefault();
       // Validation
      if (!editFormData.phone || !editFormData.location || !editFormData.bloodType) {
          alert("Please fill in all required fields.");
          return;
      }
      
      await handleEditSubmit(e);
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

  const toggleExpand = (notificationKey) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [notificationKey]: !prev[notificationKey]
    }));
  };

  const isInCoolingPeriod = (userData) => {
      if (!userData?.lastDonatedDate) return false;
      const lastDonated = new Date(userData.lastDonatedDate);
      const coolingDays = parseInt(process.env.NEXT_PUBLIC_COOLING_PERIOD_DAYS) || 90;
      const coolingDate = new Date();
      coolingDate.setDate(coolingDate.getDate() - coolingDays);
      return lastDonated > coolingDate;
  };

  // Group notifications by relatedRequestId for 'request_accepted' type
  const groupedNotifications = notifications.reduce((acc, notif) => {
      if (notif.type === 'request_accepted' && notif.relatedRequestId) {
          // Use relatedRequestId as key for grouping
          const key = notif.relatedRequestId;
          if (!acc[key]) {
              acc[key] = { ...notif, count: 1, latestTimestamp: notif.createdAt || notif.timestamp };
          } else {
              acc[key].count += 1;
              // Keep latest timestamp
              if (new Date(notif.createdAt || notif.timestamp) > new Date(acc[key].latestTimestamp)) {
                  acc[key].latestTimestamp = notif.createdAt || notif.timestamp;
              }
              // If any in the group is unread, mark group as unread (simplification)
              if (!notif.isRead) acc[key].isRead = false;
          }
      } else {
          // For other types, use _id or unique key
          acc[notif._id] = notif;
      }
      return acc;
  }, {});

  const displayedNotifications = Object.values(groupedNotifications).sort((a, b) => 
      new Date(b.latestTimestamp || b.createdAt || b.timestamp) - new Date(a.latestTimestamp || a.createdAt || a.timestamp)
  );

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
            {user.role === 'seeker' && !isInCoolingPeriod(user) && (
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
            {user.role === 'donor' && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" /> Last Donated
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.lastDonatedDate ? (
                    <>
                      {new Date(user.lastDonatedDate).toLocaleDateString()}
                      {isInCoolingPeriod(user) && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Cooling Period
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">Never / Eligible to Donate</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Profile Completion Modal (Forced) */}
      {isCompletionModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border-l-4 border-yellow-500">
              <div className="flex items-center mb-4 text-yellow-600">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  <h2 className="text-xl font-bold">Additional Details Required</h2>
              </div>
              <p className="mb-6 text-gray-600 text-sm">
                  To continue using BloodLink, please update your profile with your phone number, location, and blood type. These are critical for connecting donors and seekers.
              </p>
              <form onSubmit={handleCompletionSubmit} className="space-y-4">
                  {/* Name (Read Only) */}
                   <div className="opacity-50 pointer-events-none">
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" value={editFormData.name || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-bold text-gray-700">Phone <span className="text-red-500">*</span></label>
                      <input 
                          type="tel" 
                          required
                          placeholder="e.g 9876543210"
                          value={editFormData.phone || ''} 
                          onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                          className="mt-1 block w-full border-2 border-blue-100 focus:border-blue-500 rounded-md shadow-sm p-2" 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700">Location (City/Area) <span className="text-red-500">*</span></label>
                      <input 
                          type="text" 
                          required
                          placeholder="e.g Mumbai, Andheri"
                          value={editFormData.location || ''} 
                          onChange={e => setEditFormData({...editFormData, location: e.target.value})} 
                          className="mt-1 block w-full border-2 border-blue-100 focus:border-blue-500 rounded-md shadow-sm p-2" 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700">Blood Type <span className="text-red-500">*</span></label>
                      <select 
                          required
                          value={editFormData.bloodType || ''} 
                          onChange={e => setEditFormData({...editFormData, bloodType: e.target.value})} 
                          className="mt-1 block w-full border-2 border-blue-100 focus:border-blue-500 rounded-md shadow-sm p-2"
                      >
                          <option value="">Select Blood Type</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                              <option key={type} value={type}>{type}</option>
                          ))}
                      </select>
                  </div>
                  <div className="mt-6">
                      <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
                          Save & Continue
                      </button>
                  </div>
              </form>
            </div>
          </div>
      )}

      {/* Edit Profile Modal (Standard) */}
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

      {/* My Requests Section (Seeker Only) */}
      {user.role === 'seeker' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
             <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" /> My Blood Requests
             </h3>
          </div>
          <ul className="divide-y divide-gray-200">
             {myRequests.length === 0 ? (
                 <li className="px-4 py-4 text-gray-500 text-center">No active requests</li>
             ) : (
                 myRequests.map(req => (
                     <li key={req._id} className="px-4 py-4 sm:px-6">
                         <div className="flex justify-between items-start">
                             <div>
                                 <h4 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                     {req.bloodType} Blood Needed
                                     {req.status === 'fulfilled' && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Fulfilled</span>}
                                     {req.status === 'expired' && <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">Expired</span>}
                                 </h4>
                                 {req.patientName && (
                                     <p className="text-sm font-semibold text-gray-800 mt-1">
                                         Patient: {req.patientName}
                                     </p>
                                 )}
                                 <p className="text-sm text-gray-500 mt-1 flex items-center">
                                     <MapPin className="h-4 w-4 mr-1"/> {req.location}
                                 </p>
                                 <p className="text-xs text-gray-400 mt-1">
                                     Posted: {new Date(req.createdAt).toLocaleDateString()}
                                 </p>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-medium text-gray-900">
                                     {req.acceptedBy?.length || 0} Donors Accepted
                                 </p>
                             </div>
                         </div>
                     </li>
                 ))
             )}
          </ul>
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
          {displayedNotifications.length === 0 ? (
            <li className="px-4 py-4 text-gray-500 text-center">No new notifications</li>
          ) : (
            displayedNotifications.map((notif) => {
                // Determine logic key for expansion
                const notificationKey = notif.relatedRequestId || notif._id;
                
                return (
                  <li 
                    key={notif._id} 
                    className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="mb-2 sm:mb-0 flex-1">
                        {notif.type === 'request_accepted' ? (
                           <>
                            <p className="text-sm font-medium text-green-600 truncate">
                              Request Accepted!
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {notif.count && notif.count > 1 
                                  ? `${notif.count} donors have accepted your blood request.` 
                                  : notif.message}
                            </p>
                            {notif.relatedRequestId && (
                                <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!acceptedDonors[notif.relatedRequestId]) {
                                        fetchAcceptedDonors(notif.relatedRequestId);
                                      }
                                      toggleExpand(notificationKey);
                                    }}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                                >
                                    {expandedNotifications[notificationKey] ? (
                                      <>
                                        <ChevronUp className="h-3 w-3" />
                                        Hide Donor Details
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-3 w-3" />
                                        View Donor Details
                                      </>
                                    )}
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
                          {new Date(notif.latestTimestamp || notif.createdAt || notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {(user.role === 'donor' || user.isAvailable) && notif.type !== 'request_accepted' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptRequest(notif);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2 sm:mt-0"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                    
                    {notif.relatedRequestId && expandedNotifications[notificationKey] && acceptedDonors[notif.relatedRequestId] && (
                        <div className="mt-4 bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 transition-all duration-300">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <Droplet className="h-4 w-4 text-red-500" />
                              Willing Donors ({acceptedDonors[notif.relatedRequestId].length})
                            </h4>
                            <ul className="space-y-3">
                                {acceptedDonors[notif.relatedRequestId].map(donor => (
                                    <li key={donor._id} className="flex flex-col bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{donor.name}</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="inline-flex items-center gap-1">
                                                      <Mail className="h-3 w-3" />
                                                      {maskData(donor.email, 'email')}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="inline-flex items-center gap-1">
                                                      <Phone className="h-3 w-3" />
                                                      {maskData(donor.phone, 'phone')}
                                                    </span>
                                                </p>
                                                {donor.bloodType && (
                                                  <p className="text-xs font-medium text-red-600 mt-1">
                                                    Blood Type: {donor.bloodType}
                                                  </p>
                                                )}
                                                {isInCoolingPeriod(donor) && (
                                                   <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                      <CheckCircle className="h-3 w-3 mr-1" /> Donated Recently
                                                   </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 ml-3">
                                                <a 
                                                  href={`tel:${donor.phone}`} 
                                                  className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors" 
                                                  title="Call"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Phone className="h-4 w-4" />
                                                </a>
                                                <a 
                                                  href={`mailto:${donor.email}`} 
                                                  className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors" 
                                                  title="Email"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                                <a 
                                                  href={`sms:${donor.phone}`} 
                                                  className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors" 
                                                  title="Message"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>
                                        
                                        {/* Admin Only: Confirm Donation Button */}
                                        {user.role === 'admin' && !isInCoolingPeriod(donor) && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConfirmDonation(donor._id, notif.relatedRequestId);
                                                  }}
                                                  className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-black transition-colors"
                                                >
                                                  Mark as Donated
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </li>
                );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
