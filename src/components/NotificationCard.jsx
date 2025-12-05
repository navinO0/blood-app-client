"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Phone, Mail, MessageSquare, MapPin, Droplet, CheckCircle } from 'lucide-react';

export default function NotificationCard({ 
  notification, 
  user, 
  onAccept, 
  onFetchDonors, 
  acceptedDonors,
  onClick 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const isAccepted = notification.status === 'accepted';
  const isExpired = notification.status === 'expired';
  const isPending = notification.status === 'pending' || !notification.status;

  const handleAccept = async (e) => {
    e.stopPropagation(); // Prevent notification click
    setIsAccepting(true);
    await onAccept(notification);
    setIsAccepting(false);
  };

  const handleViewDonors = (e) => {
    e.stopPropagation();
    if (!acceptedDonors[notification.relatedRequestId]) {
      onFetchDonors(notification.relatedRequestId);
    }
    setIsExpanded(!isExpanded);
  };

  const donors = acceptedDonors[notification.relatedRequestId] || [];

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-all cursor-pointer border-l-4 ${
        !notification.isRead ? 'bg-blue-50 border-blue-500' : 'border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="mb-2 sm:mb-0 flex-1">
          {notification.type === 'request_accepted' ? (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-600">Request Accepted!</p>
              </div>
              <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Droplet className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-red-600">
                  Urgent: {notification.bloodType || 'Blood'} Needed
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              {notification.location && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  {notification.location}
                </div>
              )}
            </>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-xs text-gray-400">
              {new Date(notification.createdAt || notification.timestamp).toLocaleString()}
            </p>
            {notification.status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isAccepted ? 'bg-green-100 text-green-800' :
                isExpired ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {notification.status}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 sm:ml-4">
          {/* Accept Button for Donors */}
          {(user.role === 'donor' || user.isAvailable) && 
           notification.type !== 'request_accepted' && 
           isPending && (
            <motion.button
              onClick={handleAccept}
              disabled={isAccepting || isAccepted}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAccepting || isAccepted
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              }`}
              whileHover={!isAccepting && !isAccepted ? { scale: 1.05 } : {}}
              whileTap={!isAccepting && !isAccepted ? { scale: 0.95 } : {}}
            >
              {isAccepting ? 'Accepting...' : isAccepted ? 'Accepted ✓' : 'Accept'}
            </motion.button>
          )}

          {/* View Donors Button for Seekers */}
          {notification.type === 'request_accepted' && notification.relatedRequestId && (
            <motion.button
              onClick={handleViewDonors}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Donors
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View Donors ({donors.length})
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Collapsible Donor Details */}
      <AnimatePresence>
        {isExpanded && donors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Willing Donors ({donors.length})
              </h4>
              <div className="space-y-3">
                {donors.map((donor, idx) => (
                  <motion.div
                    key={donor._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-3 rounded-md shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Droplet className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{donor.name}</p>
                          <p className="text-xs text-gray-500">{donor.bloodType}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Available
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <a
                        href={`tel:${donor.phone}`}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </a>
                      <a
                        href={`sms:${donor.phone}`}
                        className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        SMS
                      </a>
                      <a
                        href={`mailto:${donor.email}`}
                        className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-all sm:col-span-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </a>
                    </div>
                    
                    {donor.location && (
                      <div className="mt-2 flex items-center text-xs text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {donor.location}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
