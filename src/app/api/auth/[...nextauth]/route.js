import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });
          
          const user = await res.json();

          if (res.ok && user) {
            return user;
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          // Check if user exists or create new user
          const res = await fetch(`${apiUrl}/api/auth/google-signin`, {
            method: "POST",
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              googleId: account.providerAccountId,
            }),
            headers: { "Content-Type": "application/json" }
          });
          
          const userData = await res.json();
          
          if (res.ok && userData) {
            // Attach backend user data to the user object
            user._id = userData._id;
            user.role = userData.role;
            user.bloodType = userData.bloodType;
            user.location = userData.location;
            user.phone = userData.phone;
            user.isAvailable = userData.isAvailable;
            user.token = userData.token;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user._id;
        token.role = user.role;
        token.accessToken = user.token;
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
