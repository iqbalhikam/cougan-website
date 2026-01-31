import { NextResponse } from 'next/server';
import { quotaService } from '@/lib/quota-service';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached

export async function GET() {
  const metrics = quotaService.getMetrics();
  return NextResponse.json(metrics);
}
