async function searchDuckDuckGo(query) {
  try {
    // Step 1: Get the vqd token from DuckDuckGo
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    );
    const tokenText = await tokenRes.text();
    const vqd = tokenText.match(/vqd=["']?([^"'&]+)/)?.[1];

    if (!vqd) {
      console.error('Failed to get DuckDuckGo vqd token');
      return [];
    }

    // Step 2: Fetch images using the token
    const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&p=1&s=0&o=json`;
    const imageRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://duckduckgo.com/',
      },
    });

    const data = await imageRes.json();
    return data.results || [];
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

const getImagesDuckDuckGo = async (query) => {
  const ddgResults = await searchDuckDuckGo(query);

  if (ddgResults.length > 0) {
    return {
      source: 'duckduckgo',
      results: ddgResults.map((item) => ({
        image: item.image,
        thumbnail: item.thumbnail,
        width: item.width || 400,
        height: item.height || 300,
        title: item.title || 'Image',
      })),
    };
  }

  return { source: 'duckduckgo', results: [] };
};

module.exports = {
  getImagesDuckDuckGo,
};
