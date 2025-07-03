/**
 * Summarizer Agent Wrapper
 * Integrates the SummarizerAgent class into the LangGraph workflow
 * Uses interest scores to select articles for main stories vs quick bites
 */

import { SummarizerAgent } from './summarizer';
import type {
  Article,
  ScrapedContent,
  ExecutiveSummary,
} from '../../../../shared/types';

/**
 * Summarizer agent function that wraps the SummarizerAgent class for LangGraph integration
 * Uses interest scores to intelligently select articles for main stories vs quick bites
 * @param state - State containing scraped content and original articles
 * @returns Updated state with executive summary
 */
export async function summarizerAgent(state: {
  clusteredArticles: Article[];
  scrapedContent: ScrapedContent[];
  scrapingComplete: boolean;
  userInterests: string[];
}): Promise<{
  executiveSummary: ExecutiveSummary;
  summarizationComplete: boolean;
}> {
  console.log('📝 SummarizerAgent: Starting intelligent summary generation');

  if (!state.clusteredArticles || state.clusteredArticles.length === 0) {
    console.log('📝 SummarizerAgent: No articles to summarize');
    throw new Error('No articles available for summarization');
  }

  try {
    const summarizerInstance = new SummarizerAgent();

    // Sort articles by interest score (descending) to prioritize high-interest content
    const sortedArticles = [...state.clusteredArticles].sort(
      (a, b) => (b.interest_score || 0) - (a.interest_score || 0)
    );

    console.log(
      `📝 SummarizerAgent: Processing ${sortedArticles.length} articles sorted by interest score`
    );

    // Log top articles for debugging
    console.log('📝 SummarizerAgent: Top 5 articles by interest score:');
    sortedArticles.slice(0, 5).forEach((article, index) => {
      console.log(
        `  ${index + 1}. ${article.title} (interest: ${article.interest_score?.toFixed(3) || 'N/A'})`
      );
    });

    // Determine thresholds for main stories vs quick bites based on interest scores
    const interestScores = sortedArticles
      .map(a => a.interest_score || 0)
      .filter(score => score > 0);

    let mainStoryThreshold = 0.6; // Default threshold
    if (interestScores.length > 0) {
      // Use median score as threshold, but ensure we get at least 3 main stories
      const sortedScores = [...interestScores].sort((a, b) => b - a);
      const medianIndex = Math.floor(sortedScores.length / 2);
      mainStoryThreshold = Math.max(0.4, sortedScores[medianIndex]);

      // Ensure we have at least 3 main stories by lowering threshold if needed
      const mainStoryCount = sortedArticles.filter(
        a => (a.interest_score || 0) >= mainStoryThreshold
      ).length;
      if (mainStoryCount < 3 && sortedArticles.length >= 3) {
        mainStoryThreshold = sortedScores[2] || 0.4; // Use 3rd highest score
      }
    }

    console.log(
      `📝 SummarizerAgent: Using main story threshold: ${mainStoryThreshold.toFixed(3)}`
    );

    // Filter scraped content to match our sorted articles and group by priority
    const scrapedContentMap = new Map<string, ScrapedContent>();
    state.scrapedContent.forEach(content => {
      scrapedContentMap.set(content.url, content);
    });

    // Prepare prioritized scraped content for the summarizer
    const prioritizedScrapedContent: ScrapedContent[] = [];

    sortedArticles.forEach(article => {
      const scrapedContent = scrapedContentMap.get(article.url);
      if (scrapedContent) {
        prioritizedScrapedContent.push(scrapedContent);
      }
    });

    console.log(
      `📝 SummarizerAgent: Found ${prioritizedScrapedContent.length} scraped articles out of ${sortedArticles.length} total`
    );

    // Generate the executive summary using the existing SummarizerAgent
    const summary = await summarizerInstance.generateSummary(
      prioritizedScrapedContent,
      sortedArticles,
      state.userInterests
    );

    console.log(
      `📝 SummarizerAgent: Generated summary with ${summary.mainStories.length} main stories and ${summary.quickBites.length} quick bites`
    );

    // Log summary statistics
    const mainStoryArticles = sortedArticles.filter(
      a => (a.interest_score || 0) >= mainStoryThreshold
    );
    const quickBiteArticles = sortedArticles.filter(
      a => (a.interest_score || 0) < mainStoryThreshold
    );

    console.log('📝 SummarizerAgent: Summary statistics:');
    console.log(
      `  - Main stories: ${summary.mainStories.length} (from ${mainStoryArticles.length} high-interest articles)`
    );
    console.log(
      `  - Quick bites: ${summary.quickBites.length} (from ${quickBiteArticles.length} lower-interest articles)`
    );
    console.log(`  - Total images: ${summary.images.length}`);
    console.log(`  - Total citations: ${summary.citations.length}`);

    return {
      executiveSummary: summary,
      summarizationComplete: true,
    };
  } catch (error) {
    console.error('📝 SummarizerAgent: Error during summarization:', error);
    throw error;
  }
}
