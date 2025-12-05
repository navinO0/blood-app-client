"use client";
import { useState } from 'react';
import api from '../../utils/api';
import { Search as SearchIcon, MapPin, Droplet, Phone } from 'lucide-react';

export default function Search() {
  const [bloodType, setBloodType] = useState('');
  const [location, setLocation] = useState('');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get('/blood/donors', {
        params: { bloodType, location }
      });
      setDonors(data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Find Blood Donors</h1>
        <p className="mt-4 text-xl text-gray-500">Search by blood type and location to find available donors.</p>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-12">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
            <select
              id="bloodType"
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
            >
              <option value="">Any Blood Type</option>
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
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="City or Area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={loading}
            >
              {loading ? 'Searching...' : <><SearchIcon className="h-5 w-5 mr-2" /> Search Donors</>}
            </button>
          </div>
        </form>
      </div>

      {searched && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {donors.length > 0 ? `Found ${donors.length} Donors` : 'No donors found matching your criteria'}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {donors.map((donor) => (
              <div key={donor._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border-l-4 border-red-500">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{donor.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {donor.bloodType}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {donor.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {donor.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Droplet className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      Available to donate
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <a href={`tel:${donor.phone}`} className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center justify-center">
                    <Phone className="h-4 w-4 mr-2" /> Contact Donor
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
