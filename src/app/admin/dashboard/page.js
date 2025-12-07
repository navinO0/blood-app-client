"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../utils/api';
import { useSession } from "next-auth/react";
import { CheckCircle, Clock, MapPin, User, Droplet } from 'lucide-react';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' || (session?.user?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      // In a real app, you might want a specific endpoint for admin to get all requests
      // For now, we'll assume we can fetch all or filter on client
      // Since we don't have a 'get all requests' endpoint for admin, we might need to add one
      // OR we can reuse existing endpoints if they return enough data.
      // Let's assume we need to add an endpoint or use what we have.
      // Given the constraints, I'll assume we might need to fetch requests that have accepted donors.
      // Since we don't have a dedicated endpoint, I'll simulate it or use a placeholder if needed.
      // BUT, I should have added an endpoint for this in the plan.
      // Let's check if I can use an existing one. GET /api/blood/requests/:id is single.
      // I'll add a quick endpoint to get all requests with accepted donors in the backend step if I missed it,
      // OR I can just fetch a list if available.
      // Wait, I didn't add a "get all requests" endpoint.
      // I will add a simple one now via a separate tool call or just mock it for now?
      // No, I should add it.
      
      // For now, let's try to fetch requests. I'll add the endpoint in the next step.
      const { data } = await api.get('/blood/admin/requests'); 
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDonation = async (requestId, donorId) => {
    if (!confirm('Are you sure you want to confirm this donation? This will update the donor\'s last donation date.')) return;

    try {
      await api.post('/blood/confirm-donation', { requestId, donorId });
      alert('Donation confirmed successfully');
      fetchRequests(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Error confirming donation');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard - Donation Management</h1>

      <div className="space-y-6">
        {requests.map((request) => (
          <div key={request._id} className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-red-600" />
                  Request for {request.bloodType}
                </h3>
                <div className="mt-1 text-sm">
                  {request.patientName && (
                    <p className="font-medium text-gray-900">
                      Patient: <span className="text-gray-700">{request.patientName}</span>
                    </p>
                  )}
                  <p className="text-gray-500">
                    Requested by: <span className="font-medium text-gray-900">{request.seekerId?.name || 'Unknown'}</span>
                  </p>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" /> {request.location}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Expires: {new Date(request.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                request.status === 'fulfilled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status}
              </span>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Accepted Donors</h4>
              {request.acceptedBy && request.acceptedBy.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {request.acceptedBy.map((donor) => (
                    <li key={donor._id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                          <p className="text-xs text-gray-500">{donor.email} | {donor.phone}</p>
                          {donor.lastDonatedDate && (
                             <p className="text-xs text-orange-600">Last donated: {new Date(donor.lastDonatedDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      
                      {request.status !== 'fulfilled' && (
                        <button
                          onClick={() => handleConfirmDonation(request._id, donor._id)}
                          className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Confirm Donation
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No donors have accepted this request yet.</p>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active blood requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
