"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../utils/api';
import { CheckCircle, XCircle, Loader, Share2, Copy, Mail, MessageCircle, Droplet, MapPin, User, Phone } from 'lucide-react';

export default function ShareBloodRequest() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [message, setMessage] = useState('');
  
  // Form state for new donor registration
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: '',
    location: '',
    emailNotifications: true,
  });

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const response = await api.get(`/blood/requests/${requestId}`);
      setRequest(response.data);
      // Pre-fill blood type to match the request
      setFormData(prev => ({ ...prev, bloodType: response.data.bloodType }));
    } catch (error) {
      console.error('Error fetching request:', error);
      setMessage('Failed to load blood request details.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.bloodType || !formData.location) {
      setMessage('Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await api.post('/blood/accept', {
        requestId,
        donorData: formData
      });

      setStatus('success');
      if (response.data.newDonorCreated) {
        setMessage('Thank you! Your account has been created and the seeker has been notified.');
      } else {
        setMessage('Thank you! The seeker has been notified of your help.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to accept request. Please try again.');
    }
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const text = `Urgent Blood Request!\n\nBlood Type: ${request?.bloodType}\nLocation: ${request?.location}\n\nPlease help if you can: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Urgent Blood Request - ${request?.bloodType} needed`;
    const body = `Hello,\n\nThere is an urgent blood request:\n\nBlood Type: ${request?.bloodType}\nLocation: ${request?.location}\n${request?.patientName ? `Patient: ${request.patientName}\n` : ''}${request?.quantity ? `Quantity: ${request.quantity}\n` : ''}\n\nIf you can help, please visit: ${window.location.href}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Loader className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600">This blood request could not be found.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button 
            onClick={() => router.push('/')} 
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Request Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Droplet className="h-8 w-8 text-red-600" />
              Blood Request
            </h1>
            <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-bold text-lg">
              {request.bloodType}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-lg font-semibold text-gray-900">{request.location}</p>
                {request.locationUrl && (
                  <a
                    href={request.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    <MapPin className="h-3 w-3" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {request.patientName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="text-lg font-semibold text-gray-900">{request.patientName}</p>
                </div>
              </div>
            )}

            {request.quantity && (
              <div className="flex items-start gap-3">
                <Droplet className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Quantity Needed</p>
                  <p className="text-lg font-semibold text-gray-900">{request.quantity}</p>
                </div>
              </div>
            )}

            {request.seekerId && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {request.seekerId.name}
                    {request.seekerId.phone && ` • ${request.seekerId.phone}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3 font-medium">Share this request:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                onClick={shareViaEmail}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Donor Registration Form */}
        {status !== 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can You Help?</h2>
            <p className="text-gray-600 mb-6">
              Fill in your details below to accept this blood request. If you&apos;re not registered, we&apos;ll create an account for you.
            </p>

            {status === 'error' && message && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="+91 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Blood Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="bloodType"
                  required
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Location <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="City or Area"
                />
              </div>

              <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="text-sm text-gray-700">
                  <span className="font-medium">Receive email notifications</span>
                  <p className="text-gray-600 mt-1">
                    Get notified when there are blood requests matching your blood type in your area.
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Yes, I Can Help!
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
