import * as cheerio from 'cheerio';

/**
 * Resolves the YouTube Channel ID from a given URL or handle.
 * @param input - The YouTube URL (e.g., https://youtube.com/@handle) or simply the handle (@handle).
 * @returns The resolved Channel ID (e.g., UC...) or null if not found.
 */
export async function resolveChannelId(input: string): Promise<string | null> {
  const url = input.startsWith('http') ? input : `https://youtube.com/${input}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch YouTube page: ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // YouTube usually stores channel ID in meta tags
    const channelId = $('meta[itemprop="channelId"]').attr('content') || $('meta[property="og:url"]').attr('content')?.split('/').pop();

    if (channelId && channelId.startsWith('UC')) {
      return channelId;
    }

    // Fallback: Try searching for "externalId" in script tags (rendering initial data)
    const scriptContent = $('script')
      .filter((i, el) => {
        return $(el).html()?.includes('externalId') || false;
      })
      .html();

    if (scriptContent) {
      const match = scriptContent.match(/"externalId":"(UC[^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error resolving Channel ID:', error);
    return null;
  }
}
