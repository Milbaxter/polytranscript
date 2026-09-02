import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier') || 'starter';
  
  const limits: Record<string, number> = {
    free: 50,
    starter: 500,
    pro: 3000,
    scale: 15000,
  };

  const randomSuffix = Math.random().toString(36).substring(2, 14);
  const key = `poly_${tier}_${randomSuffix}`;

  return NextResponse.json({
    key,
    tier,
    monthly_limit: limits[tier] || 500,
    used_this_month: 0,
    active: true,
  });
}
