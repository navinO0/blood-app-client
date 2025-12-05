"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Droplet, MapPin, User, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../utils/api';

export default function BloodRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/blood/requests/${requestId}`);
      setRequest(res.data);
      setBloodType(res.data.bloodType); // Pre-fill blood type
      setLoading(false);
    } catch (err) {
      setError('Blood request not found');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setMessage('');

    try {
      // Register as donor
      const registerRes = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        location,
        bloodType,
        role: 'donor',
        emailNotifications,
      });

      // Auto-accept the request
      await api.post('/blood/accept', {
        requestId: request._id,
        donorId: registerRes.data._id,
        donorName: name,
      });

      setRegistered(true);
      setMessage('Registration successful! The seeker has been notified.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center">
          <Droplet className="h-12 w-12 text-red-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center"
        >
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You! 🙏</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-green-800">
              You'll receive notifications for future blood requests matching your blood type.
            </p>
          </div>
          <motion.button
            onClick={() => router.push('/login')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Login to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Blood Request Details */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <Droplet className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            🩸 Urgent Blood Needed
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Someone needs your help. Please consider donating.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Droplet className="h-6 w-6 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Blood Type</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{request.bloodType}</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Location</span>
              </div>
              <p className="text-xl font-semibold text-gray-900">{request.location}</p>
            </div>

            {request.patientName && (
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Patient</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{request.patientName}</p>
              </div>
            )}

            {request.quantity && (
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-2">
                  <Heart className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Quantity</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{request.quantity}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Donor Registration Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Register as a Donor
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Fill in your details to help save a life
          </p>

          {message && !registered && (
            <div className={`p-4 mb-6 rounded-lg ${message.includes('failed') || message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="City or Area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Blood Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Blood Type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Receive email notifications
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Get notified when someone needs your blood type in your area. You can unsubscribe anytime.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> By registering, you agree to be contacted for blood donation requests. 
                Your contact information will only be shared with seekers when you accept a request.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={registering}
              className="w-full bg-red-600 text-white py-4 px-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-50 transition-all"
              whileHover={{ scale: registering ? 1 : 1.02 }}
              whileTap={{ scale: registering ? 1 : 0.98 }}
            >
              {registering ? 'Registering...' : 'Register & Help Save a Life'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-red-600 font-medium hover:underline">
              Login here
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
