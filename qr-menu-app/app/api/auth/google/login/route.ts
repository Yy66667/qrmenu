import { NextResponse } from 'next/server';

export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;

  const googleOAuthURL =
    "https://accounts.google.com/o/oauth2/v2/auth"
    + `?client_id=${process.env.GOOGLE_CLIENT_ID}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&response_type=code`
    + `&scope=openid%20email%20profile`
    + `&prompt=consent`; 
    
  return NextResponse.redirect(googleOAuthURL);
}
