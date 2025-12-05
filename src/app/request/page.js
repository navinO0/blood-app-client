"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import { useSession } from "next-auth/react";
export default function RequestBlood() {
  const [user, setUser] = useState(null);
  const [bloodType, setBloodType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const parsedUser = session.user;
      setUser(parsedUser);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/blood/request', {
        seekerId: user._id,
        bloodType,
        location,
      });
      setMessage('Request posted successfully! Donors will be notified.');
    } catch (error) {
      setMessage('Error posting request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Request Blood</h1>
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Blood Type Needed</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Hospital or City"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  );
}
