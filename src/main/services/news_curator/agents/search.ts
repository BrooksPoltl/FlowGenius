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
export async function searchAgent(state: any): Promise<any> {
  try {
    const { userInterests, error } = state;

    // If there was an error in previous agent, pass it through
    if (error) {
      return {
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

    // Search for articles for each interest with rate limiting (1 TPS)
    for (let i = 0; i < userInterests.length; i++) {
      const interest = userInterests[i];

      try {
        // Add delay between requests to respect 1 TPS limit (except for first request)
        if (i > 0) {
          console.log(`Waiting 1 second before searching for "${interest}"...`);
          await new Promise(resolve => {
            setTimeout(resolve, 1000);
          });
        }

        console.log(`Searching for "${interest}"...`);
        const searchResults = await searchNewsForTopic(interest, braveApiKey);
        articles.push(...searchResults);
        console.log(`Found ${searchResults.length} articles for "${interest}"`);
      } catch (error) {
        const errorMessage = `Failed to search for "${interest}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        searchErrors.push(errorMessage);
      }
    }

    return {
      searchResults: articles,
      searchComplete: true,
      searchErrors: searchErrors.length > 0 ? searchErrors : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred in SearchAgent';
    console.error('SearchAgent error:', errorMessage);

    return {
      searchResults: [],
      searchComplete: false,
      searchErrors: [errorMessage],
    };
  }
}

/**
 * Formats the published date from Brave Search API
 * @param age - The age string from Brave API (e.g., "2 hours ago", "1 day ago")
 * @returns ISO date string or undefined
 */
function formatPublishedDate(age?: string): string | undefined {
  if (!age) return undefined;

  try {
    // Brave API returns relative time like "2 hours ago", "1 day ago"
    // Convert to approximate ISO date
    const now = new Date();

    if (age.includes('hour')) {
      const hours = parseInt(age.match(/\d+/)?.[0] || '0', 10);
      now.setHours(now.getHours() - hours);
    } else if (age.includes('day')) {
      const days = parseInt(age.match(/\d+/)?.[0] || '0', 10);
      now.setDate(now.getDate() - days);
    } else if (age.includes('minute')) {
      const minutes = parseInt(age.match(/\d+/)?.[0] || '0', 10);
      now.setMinutes(now.getMinutes() - minutes);
    }

    return now.toISOString();
  } catch (error) {
    console.warn('Failed to parse age:', age);
    return undefined;
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
    count: '10', // Limit to 10 articles per topic
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
      published_at: formatPublishedDate(result.age),
      thumbnail: result.thumbnail?.src,
    })
  );
}
