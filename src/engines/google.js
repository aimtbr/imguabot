const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '<error>';
const GOOGLE_SEARCH_ENGINE_ID =
  Deno.env.get('GOOGLE_SEARCH_ENGINE_ID') || '<error>';

// ============================================
// Image Search: Google Custom Search (Paid)
// Free tier: 100 queries/day
// ============================================

async function searchGoogle(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google API not configured, skipping');
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID);
    url.searchParams.set('q', query);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', '10'); // Max 10 per request

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      console.error('Google API error:', data.error.message);
      return [];
    }

    return data.items || [];
  } catch (error) {
    console.error('Google search error:', error);
    return [];
  }
}

const getImagesGoogle = async (query) => {
  const googleResults = await searchGoogle(query);

  if (googleResults.length > 0) {
    return {
      source: 'google',
      results: googleResults.map((item) => ({
        image: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        width: item.image?.width || 400,
        height: item.image?.height || 300,
        title: item.title || 'Image',
      })),
    };
  }

  return { source: 'google', results: [] };
};

module.exports = {
  getImagesGoogle,
};
