"use client";
import { motion } from 'framer-motion';

export default function AvailabilityToggle({ isAvailable, onToggle, loading }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
        <div>
          <h3 className="font-semibold text-gray-900">Availability Status</h3>
          <p className="text-sm text-gray-600">
            {isAvailable ? 'Available to donate' : 'Not available'}
          </p>
        </div>
      </div>
      
      <motion.button
        onClick={onToggle}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
          isAvailable ? 'bg-green-500' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform`}
          animate={{ x: isAvailable ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
