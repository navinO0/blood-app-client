import Link from 'next/link';
import { Heart, Search, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-red-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Save a Life, Donate Blood</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Connect with blood donors in your area or sign up to become a donor and help those in need.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/search" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105">
            Find Blood
          </Link>
          <Link href="/register" className="bg-red-800 text-white hover:bg-red-900 px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105">
            Register as Donor
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Register</h3>
            <p className="text-gray-600">Sign up as a donor or a seeker. Create your profile to get started.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Search</h3>
            <p className="text-gray-600">Find blood donors by blood type and location in real-time.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Connect</h3>
            <p className="text-gray-600">Contact donors directly and arrange for blood donation.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-100 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to make a difference?</h2>
        <p className="text-xl text-gray-600 mb-8">Join our community of heroes today.</p>
        <Link href="/register" className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105">
          Get Started
        </Link>
      </section>
    </div>
  );
}
