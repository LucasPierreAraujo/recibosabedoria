// app/api/auth/verify/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../../lib/auth';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const payload = await verifyToken(token.value);
    
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({ 
      authenticated: true, 
      user: { username: payload.username }
    });
    
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}