import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    enabled: true,
    text: process.env.SPONSOR_TEXT || '🚀 Sponsor this slot — Reach 100K+ AI builders & researchers monthly',
    link: process.env.SPONSOR_LINK || '/pricing#sponsor',
    badge: process.env.SPONSOR_BADGE || 'Featured Sponsor',
  });
}
