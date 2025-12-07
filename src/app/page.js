import Link from 'next/link';
import { Heart, Search, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Save a Life, Donate Blood</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Join our community of heroes. Your donation can save up to three lives.
        </p>
        
        <div className="flex flex-col items-center gap-8 mt-8">
          <div className="bg-white p-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://bloodlinkhelp.netlify.app/register&color=dc2626" 
              alt="Scan to Register" 
              className="w-48 h-48"
            />
            <p className="text-red-600 font-bold mt-2 text-sm">Scan to Register</p>
          </div>
          
          <Link href="/register" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all hover:scale-105 hover:shadow-xl">
            Register as Donor
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow border-t-4 border-red-500">
            <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Register</h3>
            <p className="text-gray-600">Sign up as a donor. It takes less than 2 minutes to create your profile.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow border-t-4 border-red-500">
            <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Get Verified</h3>
            <p className="text-gray-600">Our admins verify all donors to ensure a safe and reliable network.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow border-t-4 border-red-500">
            <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-4">Save Lives</h3>
            <p className="text-gray-600">Receive notifications when your blood type is needed nearby.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-50 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to make a difference?</h2>
        <p className="text-xl text-gray-600 mb-8">Every drop counts. Start your journey today.</p>
        <Link href="/register" className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105">
          Join Now
        </Link>
      </section>
    </div>
  );
}
