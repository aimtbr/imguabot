import { getImagesDuckDuckGo } from './engines/duckduckgo.js';
import { getImagesGoogle } from './engines/google.js';
import { SEARCH_ENGINE } from './config.js';

// ============================================
// Main Search Function
// ============================================

export async function searchImages(query, pageOffset = 0) {
  try {
    if (SEARCH_ENGINE === 'google') {
      return await getImagesGoogle(query);
    }

    if (SEARCH_ENGINE === 'duckduckgo') {
      return await getImagesDuckDuckGo(query, pageOffset);
    }

    return { source: 'none', results: [], failed: false };
  } catch (error) {
    console.error('Search error:', error);

    return { source: 'none', results: [], failed: true };
  }
}
