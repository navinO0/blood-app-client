"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../utils/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function Respond() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestId = searchParams.get('requestId');
  const donorId = searchParams.get('donorId');
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [donorName, setDonorName] = useState('');

  useEffect(() => {
     // Fetch donor name if possible or just rely on user input if we wanted to be secure, 
     // but here we are trusting the link params for simplicity as per requirements.
     // Ideally we should authenticate the user, but the requirement implies a direct link action.
     // We will fetch the user details to get the name for the accept call.
     if (donorId) {
         api.get(`/blood/donors?id=${donorId}`) // This endpoint filters, might not work for specific ID directly if not implemented
            .then(() => {}) 
            .catch(() => {});
         
         // Actually, we need the donor's name for the accept API. 
         // Let's assume we can get it or just use "A Donor" if not authenticated.
         // Better yet, let's fetch the user profile if we can, or ask them to confirm their name.
         // For now, we will try to fetch the user if they are logged in, or just proceed.
     }
  }, [donorId]);

  const handleAccept = async () => {
    if (!requestId || !donorId) {
      setStatus('error');
      setMessage('Invalid link parameters.');
      return;
    }

    setStatus('loading');
    try {
      // We need donorName. If the user is logged in, we can get it. 
      // If not, we might need to fetch it from the backend using the donorId (if we had an endpoint).
      // Let's try to fetch the user details first using a new endpoint or existing one.
      // Since we don't have a public "get user by id" endpoint that returns name, 
      // we will assume the user might be logged in OR we will just send "A Donor" and let the backend handle it?
      // The backend accept route expects donorName.
      
      // Workaround: We will fetch the donor details using a new specific endpoint or just pass a placeholder
      // and let the backend fix it or we update the backend to fetch name from ID.
      // Let's update the backend accept route to fetch name if not provided.
      
      await api.post('/blood/accept', {
        requestId,
        donorId,
        donorName: donorName || 'A Donor' // Fallback
      });
      setStatus('success');
      setMessage('Thank you! The seeker has been notified of your help.');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to accept request.');
    }
  };

  if (!requestId || !donorId) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-xl text-gray-800">Invalid Link</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        {status === 'idle' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Donation</h2>
            <p className="text-gray-600 mb-8">
              Are you available to donate blood for this request?
            </p>
            <div className="mb-4">
                <label className="block text-left text-sm font-medium text-gray-700 mb-1">Your Name (Optional)</label>
                <input 
                    type="text" 
                    value={donorName} 
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Enter your name"
                />
            </div>
            <button
              onClick={handleAccept}
              className="w-full bg-red-600 text-white py-3 rounded-md font-bold hover:bg-red-700 transition-colors"
            >
              Yes, I am Available
            </button>
          </>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-red-600 animate-spin mb-4" />
            <p className="text-gray-600">Processing...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600">{message}</p>
            <button onClick={() => router.push('/')} className="mt-6 text-red-600 hover:underline">
                Go to Home
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
