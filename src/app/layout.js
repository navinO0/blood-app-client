import "./globals.css";
import Navbar from "../components/Navbar";
import AuthProvider from "../components/AuthProvider";

export const metadata = {
  title: "BloodLink - Connect Blood Donors & Seekers",
  description: "A platform to connect blood donors with those in need.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-6 text-center">
            <p>&copy; {new Date().getFullYear()} BloodLink. All rights reserved.</p>
          </footer>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }, function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
