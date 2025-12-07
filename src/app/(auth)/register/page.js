'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import api from '@/utils/api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    bloodType: 'A+',
    role: 'donor'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      // Registration successful, OTP sent
      setOtpSent(true);
      setVerificationEmail(res.data.email || formData.email);
      alert(res.data.message);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isUnverified) {
          // User exists but unverified, OTP resent
          setOtpSent(true);
          setVerificationEmail(err.response.data.email);
          alert(err.response.data.message);
      } else {
          setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      
      try {
          const res = await api.post('/auth/verify-otp', { email: verificationEmail, otp });
          localStorage.setItem('token', res.data.token);
          
          // Auto-login with NextAuth after successful verification
          const result = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password,
          });

          if (result?.error) {
             setError(result.error);
          } else {
             router.push('/dashboard');
          }
      } catch (err) {
          setError(err.response?.data?.message || 'Verification failed');
      } finally {
          setLoading(false);
      }
  };

  if (otpSent) {
      return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-white shadow-lg dark:bg-gray-800">
            <h1 className="text-2xl font-bold text-center">Verify Email</h1>
            <p className="text-center text-gray-500">Enter the 6-digit code sent to {verificationEmail}</p>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  required
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}
        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          <input
            name="name"
            type="text"
            required
            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
          />
          <input
            name="email"
            type="email"
            required
            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            required
            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          
          <div className="grid grid-cols-1 gap-4">
             <div>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  <option value="">Select Blood Type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
             </div>
          </div>

          <input
            name="phone"
            type="tel"
            required
            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            name="location"
            type="text"
            required
            className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="City/Location"
            value={formData.location}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-red-600 hover:text-red-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
