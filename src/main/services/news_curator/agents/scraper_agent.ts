/**
 * Scraper Agent Wrapper
 * Integrates the ScraperAgent class into the LangGraph workflow
 * Implements smart scraping that prioritizes articles by interest score within clusters
 */

import { ScraperAgent } from './scraper';
import type { Article, ScrapedContent } from '../../../../shared/types';

/**
 * Scraper agent function that wraps the ScraperAgent class for LangGraph integration
 * Implements smart scraping strategy: for each cluster, try articles in descending order of interest_score
 * @param state - State containing ranked articles
 * @returns Updated state with scraped content
 */
export async function scraperAgent(state: {
  clusteredArticles: Article[];
  articlesRanked: boolean;
}): Promise<{
  scrapedContent: ScrapedContent[];
  scrapingComplete: boolean;
  scrapingSuccessCount: number;
}> {
  console.log('🕷️ ScraperAgent: Starting smart cluster-based scraping');

  if (!state.clusteredArticles || state.clusteredArticles.length === 0) {
    console.log('🕷️ ScraperAgent: No articles to scrape');
    return {
      scrapedContent: [],
      scrapingComplete: true,
      scrapingSuccessCount: 0,
    };
  }

  try {
    const scraperInstance = new ScraperAgent();

    // Group articles by cluster and sort by interest score
    const clusterMap = new Map<string, Article[]>();

    state.clusteredArticles.forEach(article => {
      const clusterId = article.cluster_id || 'default';
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, []);
      }
      clusterMap.get(clusterId)!.push(article);
    });

    // Sort articles within each cluster by interest score (descending)
    clusterMap.forEach(articles => {
      articles.sort(
        (a, b) => (b.interest_score || 0) - (a.interest_score || 0)
      );
    });

    console.log(
      `🕷️ ScraperAgent: Found ${clusterMap.size} clusters with ${state.clusteredArticles.length} total articles`
    );

    // Smart scraping strategy: try to get at least one successful scrape per cluster
    const articlesToScrape: Article[] = [];
    const maxArticlesPerCluster = 3; // Try up to 3 articles per cluster

    for (const [clusterId, articles] of clusterMap) {
      console.log(
        `🕷️ ScraperAgent: Processing cluster ${clusterId} with ${articles.length} articles`
      );

      // Take top articles from this cluster (up to maxArticlesPerCluster)
      const clusterArticles = articles.slice(0, maxArticlesPerCluster);
      articlesToScrape.push(...clusterArticles);

      console.log(
        `🕷️ ScraperAgent: Selected ${clusterArticles.length} articles from cluster ${clusterId}`
      );
      clusterArticles.forEach(article => {
        console.log(
          `  - ${article.title} (interest: ${article.interest_score?.toFixed(3) || 'N/A'})`
        );
      });
    }

    console.log(
      `🕷️ ScraperAgent: Scraping ${articlesToScrape.length} articles across ${clusterMap.size} clusters`
    );

    // Perform the scraping
    const scrapedContent =
      await scraperInstance.scrapeArticles(articlesToScrape);

    // Count successful scrapes
    const successfulScrapes = scrapedContent.filter(content => content.success);
    console.log(
      `🕷️ ScraperAgent: Successfully scraped ${successfulScrapes.length}/${scrapedContent.length} articles`
    );

    // Log cluster success rates
    const clusterSuccessMap = new Map<
      string,
      { total: number; successful: number }
    >();

    scrapedContent.forEach(content => {
      const article = articlesToScrape.find(a => a.url === content.url);
      const clusterId = article?.cluster_id || 'default';

      if (!clusterSuccessMap.has(clusterId)) {
        clusterSuccessMap.set(clusterId, { total: 0, successful: 0 });
      }

      const stats = clusterSuccessMap.get(clusterId)!;
      stats.total++;
      if (content.success) {
        stats.successful++;
      }
    });

    console.log('🕷️ ScraperAgent: Cluster success rates:');
    clusterSuccessMap.forEach((stats, clusterId) => {
      const rate = ((stats.successful / stats.total) * 100).toFixed(1);
      console.log(
        `  - ${clusterId}: ${stats.successful}/${stats.total} (${rate}%)`
      );
    });

    return {
      scrapedContent,
      scrapingComplete: true,
      scrapingSuccessCount: successfulScrapes.length,
    };
  } catch (error) {
    console.error('🕷️ ScraperAgent: Error during scraping:', error);

    return {
      scrapedContent: [],
      scrapingComplete: false,
      scrapingSuccessCount: 0,
    };
  }
}
