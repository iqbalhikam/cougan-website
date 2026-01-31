import { NextResponse } from 'next/server';
import { getStreamers } from '@/lib/getStreamers';
import { streamers } from '@/data/streamers';

export async function GET() {
  try {
    const updatedStreamers = await getStreamers();
    return NextResponse.json(updatedStreamers);
  } catch (error) {
    console.error('Error in streamers API:', error);
    return NextResponse.json(streamers, { status: 500 });
  }
}
