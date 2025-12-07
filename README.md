# Blood Donation App - Frontend Client

A Next.js 14 frontend application for the Blood Donation platform with real-time notifications, Google OAuth, and responsive design.

## 🚀 Features

- **Next.js 14** - App Router with Server Components
- **NextAuth** - Authentication with credentials and Google OAuth
- **Real-time Notifications** - Socket.io integration with sound alerts
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Push Notifications** - Web Push API support
- **Secure Communication** - Optional AES encryption for API requests

## 📋 Prerequisites

- Node.js (v16 or higher)
- Backend server running (see `../server/README.md`)
- Google OAuth credentials (optional, for Google Sign-In)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.local.example` to `.env.local` and update:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Set up Google OAuth (optional):**
   
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env.local`

## ⚙️ Environment Variables

### Required

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_jwt_secret_key_here
```

### Optional

```bash
# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# Encryption (must match server)
NEXT_PUBLIC_ENCRYPTION_KEY=my_super_secret_key_12345
NEXT_PUBLIC_ENABLE_ENCRYPTION=false
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Application runs on http://localhost:3000 with hot reload.

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 📱 Application Pages

### Public Pages
- `/` - Home page with app overview
- `/login` - Login with email/password or Google
- `/register` - User registration
- `/search` - Search for blood donors

### Protected Pages (Require Authentication)
- `/dashboard` - User dashboard with notifications
- `/request` - Create blood request
- `/respond` - Respond to blood request (via email link)

## 🎨 UI Components

### Core Components
- **Navbar** - Navigation with notification bell
- **Dashboard** - User profile, notifications, accepted donors
- **Request Form** - Blood request creation
- **Notification System** - Real-time updates with sound

### Features
### Features
- **Unread Count Badge** - Shows number of unread notifications
- **Sound Notifications** - Audio alert for new requests & accepted donations
- **Click-to-Read** - Mark notifications as read on click
- **Donor Contact Info** - Phone, email, SMS links for accepted donors
- **Admin Toaster** - Real-time popup for Admins when users log in or accept donations
- **Persistent State** - "Accepted" button maintains state after action

## 🔐 Authentication

### Supported Methods

1. **Email/Password**
   - Register with email, password, name, location, blood type
   - Login with credentials
   - JWT token stored in session

2. **Google OAuth**
   - One-click Google Sign-In
   - Auto-creates user account
   - Syncs with backend

### Session Management
- NextAuth handles session persistence
- Automatic token refresh
- Secure HTTP-only cookies

## 🔔 Notifications

### Types
- **Blood Request** - New request matching donor's blood type
- **Request Accepted** - Donor accepted seeker's request

### Features
- Real-time via Socket.io
- Sound notification (after user interaction)
- Unread count badge
- Click to mark as read
- Visual distinction for unread items

## 🎵 Sound Notifications

**File:** `public/notification.mp3`

**Browser Restrictions:**
- Sound only plays after user interacts with page
- This is a browser security feature
- Workaround: User must click anywhere on page first

## 📁 Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/  # NextAuth configuration
│   │   ├── dashboard/               # Dashboard page
│   │   ├── login/                   # Login page
│   │   ├── register/                # Registration page
│   │   ├── request/                 # Blood request page
│   │   ├── respond/                 # Email response page
│   │   ├── search/                  # Search donors page
│   │   ├── layout.js                # Root layout
│   │   └── page.js                  # Home page
│   ├── components/
│   │   └── Navbar.jsx               # Navigation component
│   ├── utils/
│   │   ├── api.js                   # Axios instance
│   │   ├── crypto.js                # Encryption utilities
│   │   └── push.js                  # Push notification setup
│   └── app/globals.css              # Global styles
├── public/
│   └── notification.mp3             # Notification sound
├── .env.local                       # Environment variables
├── next.config.js                   # Next.js configuration
└── package.json
```

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Beautiful icon library
- **Responsive Design** - Mobile-first approach
- **Dark Mode Ready** - Color scheme support

## 🔄 Real-time Communication

### Socket.io Connection

```javascript
// Connects to backend server
const socket = io(process.env.NEXT_PUBLIC_API_URL);

// Listen for notifications
socket.on('blood-request-notification', (data) => {
  // Handle new blood request
});

socket.on('donation-accepted-notification', (data) => {
  // Handle acceptance notification
});
```

## 🧪 Testing

### Manual Testing

1. **Register a User:**
   - Go to http://localhost:3000/register
   - Fill in details and submit

2. **Create Blood Request:**
   - Login as seeker
   - Go to `/request`
   - Submit blood request
   - Check donor's dashboard for notification

3. **Accept Request:**
   - Login as donor
   - Click "Accept" on notification
   - Check seeker's dashboard for acceptance

4. **Test Google Sign-In:**
   - Click "Sign in with Google" on login page
   - Authorize with Google account

## 🐛 Troubleshooting

### "Cannot connect to server"
```bash
# Check if backend is running
curl http://localhost:5000/api/auth/login

# Verify NEXT_PUBLIC_API_URL in .env.local
```

### Google OAuth Error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check authorized redirect URIs in Google Console
- Ensure `NEXTAUTH_URL` matches your domain

### Notifications Not Working
- Check browser console for Socket.io connection errors
- Verify backend Socket.io is running
- Check CORS configuration on backend

### Sound Not Playing
- User must interact with page first (browser restriction)
- Check browser console for audio errors
- Verify `notification.mp3` exists in `public/` directory

### Session/Auth Issues
```bash
# Clear browser cookies and localStorage
# Restart Next.js dev server
npm run dev
```

## 🚀 Deployment

### Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_API_URL` to production backend URL
   - Update `NEXTAUTH_URL` to production frontend URL

### Other Platforms

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

**Environment Variables:**
- Set all variables from `.env.local`
- Update URLs to production domains

## 📊 Performance

- **Server Components** - Reduced client-side JavaScript
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Components loaded on demand

## 📝 License

MIT

## 👥 Support

For issues or questions:
1. Check browser console for errors
2. Review backend server logs
3. Verify environment variables are set correctly
4. Contact development team

---

**Note:** Make sure the backend server is running before starting the frontend application.
