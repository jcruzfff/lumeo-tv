import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
  }
  
  interface Session {
    user: {
      id?: string;
      isAdmin?: boolean;
      email?: string | null;
      name?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Access Code",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Access Code", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (credentials?.password !== 'admin123') {
            return null;
          }

          return {
            id: "1",
            email: credentials?.email,
            name: "Admin",
            isAdmin: true
          };
        } catch {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    }
  }
}; 