import NextAuth from "next-auth";
import { authOptions } from "../auth.config";

console.log('NextAuth Route Handler: Initializing with authOptions');

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async signIn({ user, account, profile, email }) {
      console.log('Sign In Attempt:', { user, account, profile, email });
      return true;
    }
  }
});

export { handler as GET, handler as POST }; 