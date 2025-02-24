import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from '@/lib/prisma';

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

const ACCESS_CODE = process.env.ACCESS_CODE;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Only log the presence of environment variables, not their values
console.log('Auth Config - Environment Check:', {
  ACCESS_CODE: ACCESS_CODE ? '✓' : '✗',
  ADMIN_EMAIL: ADMIN_EMAIL ? '✓' : '✗',
  NEXTAUTH_SECRET: NEXTAUTH_SECRET ? '✓' : '✗'
});

if (!ACCESS_CODE) {
  throw new Error('ACCESS_CODE environment variable is not set');
}

if (!ADMIN_EMAIL) {
  throw new Error('ADMIN_EMAIL environment variable is not set');
}

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

export const authOptions: AuthOptions = {
  secret: NEXTAUTH_SECRET,
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
          console.log('Auth - Starting authorization process:', {
            email: credentials?.email,
            accessCodeProvided: !!credentials?.password
          });

          if (!credentials?.email || !credentials?.password) {
            console.error('Auth - Missing credentials');
            return null;
          }

          if (credentials.password !== ACCESS_CODE) {
            console.error('Auth - Invalid access code');
            return null;
          }

          console.log('Auth - Access code verified, finding or creating user...');

          // Find or create user without password
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {
              name: credentials.email.split('@')[0],
              isAdmin: credentials.email === ADMIN_EMAIL
            },
            create: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              isAdmin: credentials.email === ADMIN_EMAIL
            }
          });

          console.log('Auth - User processed successfully:', {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            action: user.createdAt === user.updatedAt ? 'Created new user' : 'Updated existing user'
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
          };
        } catch (error) {
          console.error('Auth - Error in authorize:', error);
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
        console.log('Auth - JWT callback:', { token, user });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin;
        console.log('Auth - Session callback:', { session, token });
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development'
}; 