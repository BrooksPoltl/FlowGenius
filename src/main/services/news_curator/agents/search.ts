/**
 * SearchAgent - Searches for news articles based on scheduled interests
 * Uses Brave Search API to find relevant articles for user interests
 */

import type {
  WorkflowState,
  Article as SharedArticle,
} from '../../../../shared/types';
import db from '../../../db';

/**
 * Searches for articles based on scheduled interests
 * @param state - Current workflow state containing scheduled interests
 * @returns Updated state with search results
 */
export async function searchAgent(
  state: Partial<WorkflowState>
): Promise<Partial<WorkflowState>> {
  try {
    const scheduledInterests = state.scheduledInterests || [];

    if (scheduledInterests.length === 0) {
      console.log('🔍 No interests scheduled for search');
      return {
        ...state,
        searchResults: [],
        searchComplete: true,
      };
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!braveApiKey) {
      throw new Error('BRAVE_SEARCH_API_KEY environment variable not found');
    }

    console.log(
      `🔍 Searching for ${scheduledInterests.length} scheduled interests...`
    );

    const allResults: SharedArticle[] = [];

    // Record search attempt time for all scheduled interests
    const currentTime = new Date().toISOString();
    const updateSearchAttempt = db.prepare(`
      UPDATE Interests 
      SET last_search_attempt_at = ? 
      WHERE name = ?
    `);

    for (const interest of scheduledInterests) {
      updateSearchAttempt.run(currentTime, interest);
    }
    console.log(
      `📝 Recorded search attempt time for ${scheduledInterests.length} interests`
    );

    // Search for articles for each scheduled interest (no rate limiting needed with 20 TPS)
    for (let i = 0; i < scheduledInterests.length; i++) {
      const interest = scheduledInterests[i];

      try {
        console.log(`Searching for "${interest}"...`);
        const searchResults = await searchNewsForTopic(interest, braveApiKey);

        // Tag each article with its source interest
        const taggedResults = searchResults.map(article => ({
          ...article,
          id: article.url, // Ensure ID is set
        }));

        allResults.push(...taggedResults);
        console.log(`Found ${searchResults.length} articles for "${interest}"`);
      } catch (error) {
        console.error(`❌ Error searching for "${interest}":`, error);
        // Continue with other interests even if one fails
      }
    }

    console.log(
      `🔍 Search complete: ${allResults.length} total articles found`
    );

    return {
      ...state,
      searchResults: allResults,
      searchComplete: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('SearchAgent error:', errorMessage);

    return {
      ...state,
      searchResults: [],
      searchComplete: false,
      error: errorMessage,
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
): Promise<SharedArticle[]> {
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

  return data.results.map((result: Record<string, unknown>): SharedArticle => {
    const thumbnailUrl = (result.thumbnail as Record<string, unknown>)
      ?.src as string;

    return {
      id: (result.url as string) || '',
      title: (result.title as string) || 'No title',
      url: (result.url as string) || '',
      description: (result.description as string) || '',
      source:
        ((result.meta_url as Record<string, unknown>)?.hostname as string) ||
        (result.url as string) ||
        'Unknown source',
      publishedAt:
        formatPublishedDate(result.age as string) || new Date().toISOString(),
      thumbnail_url: thumbnailUrl,
      score: 0, // Will be set during ranking
    };
  });
}
