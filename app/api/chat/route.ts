import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache-service';
import { quotaService } from '@/lib/quota-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  const pageToken = searchParams.get('pageToken');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
  }

  const cacheKey = `chat_${chatId}_${pageToken || 'first'}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return NextResponse.json(cachedData, {
      headers: {
        'X-Cache-Hit': 'true',
        'Cache-Control': 'public, max-age=5',
      },
    });
  }

  if (quotaService.isCircuitBreakerOpen()) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    let apiUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chatId}&part=snippet,authorDetails&maxResults=20&key=${YOUTUBE_API_KEY}`;

    if (pageToken) {
      apiUrl += `&pageToken=${pageToken}`;
    }

    const res = await fetch(apiUrl, { next: { revalidate: 0 } });
    const data = await res.json();

    if (!res.ok) {
      console.error('YouTube Live Chat API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch chat' }, { status: res.status });
    }

    // Cache for 5 seconds to prevent spamming
    cacheService.set(cacheKey, data, 5);

    return NextResponse.json(data, {
      headers: {
        'X-Cache-Hit': 'false',
        'Cache-Control': 'public, max-age=5',
      },
    });
  } catch (error) {
    console.error('Server Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
