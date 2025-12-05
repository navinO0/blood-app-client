"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MailOff } from 'lucide-react';
import api from '../utils/api';

export default function EmailPreferenceToggle({ user, onUpdate }) {
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newValue = !emailNotifications;
    
    try {
      const res = await api.put('/auth/profile', {
        userId: user._id,
        emailNotifications: newValue,
      });
      
      setEmailNotifications(newValue);
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch (error) {
      console.error('Failed to update email preference:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        {emailNotifications ? (
          <Mail className="h-5 w-5 text-blue-600" />
        ) : (
          <MailOff className="h-5 w-5 text-gray-400" />
        )}
        <div>
          <h3 className="font-semibold text-gray-900">Email Notifications</h3>
          <p className="text-sm text-gray-600">
            {emailNotifications ? 'Receiving email updates' : 'Email updates disabled'}
          </p>
        </div>
      </div>
      
      <motion.button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
          animate={{ x: emailNotifications ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
