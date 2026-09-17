const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractVqd(html) {
  const patterns = [
    /vqd=["']([\d-]+)["']/,
    /"vqd":\s*["']([\d-]+)["']/,
    /vqd=([\d-]+)&/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function collectCookies(res) {
  const cookies = res.headers.getSetCookie?.() ?? [];
  return cookies.map((cookie) => cookie.split(';')[0]).join('; ');
}

// ============================================
// Image Search: DuckDuckGo (Free)
// ============================================

// Returns { results, failed }, where `failed` means DuckDuckGo refused to
// answer - which is not the same as it answering with no images.
async function searchDuckDuckGo(query, pageOffset = 0) {
  try {
    // Step 1: Get the vqd token from DuckDuckGo
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      },
    );
    const tokenText = await tokenRes.text();
    const vqd = extractVqd(tokenText);
    const cookie = collectCookies(tokenRes);

    if (!vqd) {
      console.error('Failed to get DuckDuckGo vqd token:', tokenRes.status);
      return { results: [], failed: true };
    }

    // Step 2: Fetch a single page using the requested offset
    const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&p=-1&s=${pageOffset}&o=json`;

    const imageRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        Referer: 'https://duckduckgo.com/',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });

    const raw = await imageRes.text();

    if (!imageRes.ok || !raw.trimStart().startsWith('{')) {
      console.error(
        'DuckDuckGo non-JSON response:',
        imageRes.status,
        raw.slice(0, 200),
      );
      return { results: [], failed: true };
    }

    const data = JSON.parse(raw);

    return { results: data.results || [], failed: false };
  } catch (error) {
    console.error('DuckDuckGo search error:', error);

    return { results: [], failed: true };
  }
}

export const getImagesDuckDuckGo = async (query, pageOffset = 0) => {
  const { results, failed } = await searchDuckDuckGo(query, pageOffset);

  return {
    source: 'duckduckgo',
    failed,
    results: results.map((item) => ({
      image: item.image,
      thumbnail: item.thumbnail,
      width: item.width || 400,
      height: item.height || 300,
      title: item.title || 'Image',
    })),
  };
};
