import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Remove o cookie com o mesmo path usado no login
  response.cookies.delete('auth-token', { path: '/' });

  return response;
}
