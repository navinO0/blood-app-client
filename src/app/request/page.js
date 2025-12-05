"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import { useSession } from "next-auth/react";
import { Copy, MessageCircle, Mail, Share2, CheckCircle, MapPin } from 'lucide-react';

export default function RequestBlood() {
  const [user, setUser] = useState(null);
  const [bloodType, setBloodType] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [sendEmailNotifications, setSendEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [createdRequest, setCreatedRequest] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const parsedUser = session.user;
      setUser(parsedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setCreatedRequest(null);

    try {
      const response = await api.post('/blood/request', {
        seekerId: user._id,
        bloodType,
        location,
        locationUrl: locationUrl || undefined,
        sendEmailNotifications,
      });
      setCreatedRequest(response.data);
      setMessage('Request posted successfully! Share the link below to find donors.');
      // Reset form
      setBloodType('');
      setLocation('');
      setLocationUrl('');
      setSendEmailNotifications(true);
    } catch (error) {
      setMessage('Error posting request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }

  };

  const getShareableLink = () => {
    if (!createdRequest) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${createdRequest._id}`;
  };

  const copyLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const link = getShareableLink();
    const text = `Urgent Blood Request!\n\nBlood Type: ${createdRequest.bloodType}\nLocation: ${createdRequest.location}\n\nPlease help if you can: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = () => {
    const link = getShareableLink();
    const subject = `Urgent Blood Request - ${createdRequest.bloodType} needed`;
    const body = `Hello,\n\nThere is an urgent blood request:\n\nBlood Type: ${createdRequest.bloodType}\nLocation: ${createdRequest.location}\n\nIf you can help, please visit: ${link}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Request Blood</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {createdRequest && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Share Your Request</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Share this link via WhatsApp, email, or messaging apps to reach potential donors:
          </p>

          <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={getShareableLink()}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </button>
            <button
              onClick={shareViaEmail}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Mail className="h-4 w-4" />
              Share via Email
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type Needed</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hospital or City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Google Maps Link (Optional)
          </label>
          <input
            type="url"
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Share the exact location where blood is needed (e.g., hospital address)
          </p>
        </div>
        
        <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <input
            type="checkbox"
            id="sendEmailNotifications"
            checked={sendEmailNotifications}
            onChange={(e) => setSendEmailNotifications(e.target.checked)}
            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="sendEmailNotifications" className="text-sm text-gray-700">
            <span className="font-medium flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Send email notifications to matching donors
            </span>
            <p className="text-gray-600 mt-1">
              When enabled, donors with matching blood type will receive email notifications about your request. They will also see in-app notifications regardless of this setting.
            </p>
          </label>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold transition-colors"
        >
          {loading ? 'Posting...' : 'Post Request'}
        </button>
      </form>

    </div>
  );
}
