import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ACCESS_CODE = process.env.ACCESS_CODE;

export async function POST(req: Request) {
  try {
    const { accessCode } = await req.json();

    if (accessCode === ACCESS_CODE) {
      // Create the response
      const response = NextResponse.json({ success: true });
      
      // Set the cookie
      const cookieStore = await cookies();
      cookieStore.set('accessVerified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid access code' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error verifying access code' },
      { status: 500 }
    );
  }
} 