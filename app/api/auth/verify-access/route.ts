import { NextResponse } from 'next/server';

const ACCESS_CODE = process.env.ACCESS_CODE;

if (!ACCESS_CODE) {
  throw new Error('ACCESS_CODE environment variable is not set');
}

export async function POST(req: Request) {
  try {
    const { accessCode } = await req.json();

    if (accessCode === ACCESS_CODE) {
      // Create the response with success message
      const response = NextResponse.json({ 
        success: true,
        message: 'Access code verified successfully'
      });

      // Set the cookie in the response
      response.cookies.set('accessVerified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid access code' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error verifying access code:', error);
    return NextResponse.json(
      { error: 'Error verifying access code' },
      { status: 500 }
    );
  }
} 