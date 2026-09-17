import { GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID } from '../config.js';

// ============================================
// Image Search: Google Custom Search (Paid)
// Free tier: 100 queries/day
// ============================================

async function searchGoogle(query) {
  // Not configured is a settled answer, not a transient failure
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google API not configured, skipping');
    return { results: [], failed: false };
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
      return { results: [], failed: true };
    }

    return { results: data.items || [], failed: false };
  } catch (error) {
    console.error('Google search error:', error);
    return { results: [], failed: true };
  }
}

export const getImagesGoogle = async (query) => {
  const { results, failed } = await searchGoogle(query);

  return {
    source: 'google',
    failed,
    results: results.map((item) => ({
      image: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      width: item.image?.width || 400,
      height: item.image?.height || 300,
      title: item.title || 'Image',
    })),
  };
};
