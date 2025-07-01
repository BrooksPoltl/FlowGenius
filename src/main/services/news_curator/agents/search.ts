/**
 * SearchAgent - Queries Brave Search API for news articles based on user interests
 * This agent receives interests from SettingsAgent and fetches relevant news
 */

import { SettingsState } from './settings';

export interface Article {
  title: string;
  url: string;
  description: string;
  source: string;
  published_at?: string;
  thumbnail?: string;
}

export interface SearchState extends SettingsState {
  articles: Article[];
  searchErrors?: string[];
}

/**
 * SearchAgent function that queries Brave Search API for news articles
 * @param state - State containing user interests
 * @returns Updated state with fetched articles
 */
export async function searchAgent(state: SettingsState): Promise<SearchState> {
  try {
    const { interests, error } = state;

    // If there was an error in previous agent, pass it through
    if (error) {
      return {
        ...state,
        articles: [],
        searchErrors: [error],
      };
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!braveApiKey) {
      throw new Error('BRAVE_SEARCH_API_KEY environment variable not found');
    }

    const articles: Article[] = [];
    const searchErrors: string[] = [];

    // Search for articles for each interest
    for (const interest of interests) {
      try {
        const searchResults = await searchNewsForTopic(interest, braveApiKey);
        articles.push(...searchResults);
      } catch (error) {
        const errorMessage = `Failed to search for "${interest}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        searchErrors.push(errorMessage);
      }
    }

    return {
      ...state,
      articles,
      searchErrors: searchErrors.length > 0 ? searchErrors : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in SearchAgent';
    console.error('SearchAgent error:', errorMessage);

    return {
      ...state,
      articles: [],
      searchErrors: [errorMessage],
    };
  }
}

/**
 * Searches for news articles on a specific topic using Brave Search API
 * @param topic - The topic to search for
 * @param apiKey - Brave Search API key
 * @returns Array of articles
 */
async function searchNewsForTopic(
  topic: string,
  apiKey: string
): Promise<Article[]> {
  const searchUrl = 'https://api.search.brave.com/res/v1/news/search';
  const params = new URLSearchParams({
    q: topic,
    count: '5', // Limit to 5 articles per topic
    freshness: '1d', // Only articles from last day
    text_decorations: 'false',
    search_lang: 'en',
    country: 'US',
  });

  const response = await fetch(`${searchUrl}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map(
    (result: Record<string, any>): Article => ({
      title: result.title || 'No title',
      url: result.url || '',
      description: result.description || '',
      source: result.meta_url?.hostname || result.url || 'Unknown source',
      published_at: result.age,
      thumbnail: result.thumbnail?.src,
    })
  );
}
