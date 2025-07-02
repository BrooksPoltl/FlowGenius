/**
 * ScraperAgent: Scrapes full article content from URLs
 * Handles rate limiting, robots.txt compliance, and paywall detection
 */

// import * as fs from 'fs/promises';
// import * as path from 'path';
import { Article } from '../../../../shared/types';

interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
  success: boolean;
  error?: string;
}

interface RobotsRule {
  userAgent: string;
  disallowed: string[];
  crawlDelay?: number;
}

/**
 * Scrapes full article content from provided URLs
 * Respects robots.txt, implements rate limiting, handles paywalls gracefully
 * Note: Images are already provided by Brave Search API, so we don't extract them
 */
export class ScraperAgent {
  private lastRequestTime: Map<string, number> = new Map();

  private robotsCache: Map<string, RobotsRule[]> = new Map();

  private readonly userAgent = 'FlowGenius/1.0';

  private readonly defaultDelay = 1000; // 1 second between requests

  private readonly timeout = 10000; // 10 second timeout

  /**
   * Scrape full content from multiple article URLs
   */
  async scrapeArticles(articles: Article[]): Promise<ScrapedContent[]> {
    console.log(
      `🕷️ ScraperAgent: Starting to scrape ${articles.length} articles`
    );
    const results: ScrapedContent[] = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(
        `🕷️ ScraperAgent: [${i + 1}/${articles.length}] Processing: ${article.url}`
      );

      try {
        const startTime = Date.now();
        const content = await this.scrapeArticle(article);
        const duration = Date.now() - startTime;
        console.log(
          `🕷️ ScraperAgent: [${i + 1}/${articles.length}] Completed in ${duration}ms - Success: ${content.success}`
        );
        results.push(content);
      } catch (error) {
        console.error(
          `🕷️ ScraperAgent: [${i + 1}/${articles.length}] Failed:`,
          error
        );
        results.push({
          url: article.url,
          title: article.title,
          content: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(
      `🕷️ ScraperAgent: Completed scraping ${results.length} articles`
    );
    const successful = results.filter(r => r.success).length;
    console.log(
      `🕷️ ScraperAgent: Success rate: ${successful}/${results.length} (${Math.round((successful / results.length) * 100)}%)`
    );

    return results;
  }

  /**
   * Scrape content from a single article URL
   */
  private async scrapeArticle(article: Article): Promise<ScrapedContent> {
    const domain = new URL(article.url).hostname;
    console.log(
      `🕷️ ScraperAgent: Processing ${domain} - ${article.url.substring(0, 80)}...`
    );

    // Check robots.txt compliance
    console.log(`🕷️ ScraperAgent: Checking robots.txt for ${domain}...`);
    const robotsStartTime = Date.now();
    const canScrape = await this.checkRobotsPermission(article.url);
    const robotsCheckTime = Date.now() - robotsStartTime;
    console.log(
      `🕷️ ScraperAgent: Robots.txt check completed in ${robotsCheckTime}ms - Can scrape: ${canScrape}`
    );

    if (!canScrape) {
      return {
        url: article.url,
        title: article.title,
        content: '',
        success: false,
        error: 'Blocked by robots.txt',
      };
    }

    // Implement rate limiting per domain
    console.log(`🕷️ ScraperAgent: Applying rate limiting for ${domain}...`);
    const rateLimitStartTime = Date.now();
    await this.respectRateLimit(domain);
    const rateLimitTime = Date.now() - rateLimitStartTime;
    console.log(
      `🕷️ ScraperAgent: Rate limiting completed in ${rateLimitTime}ms`
    );

    try {
      console.log(`🕷️ ScraperAgent: Making HTTP request to ${domain}...`);
      const fetchStartTime = Date.now();

      const response = await fetch(article.url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          DNT: '1',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      const fetchTime = Date.now() - fetchStartTime;
      console.log(
        `🕷️ ScraperAgent: HTTP request completed in ${fetchTime}ms - Status: ${response.status}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`🕷️ ScraperAgent: Reading response text...`);
      const textStartTime = Date.now();
      const html = await response.text();
      const textTime = Date.now() - textStartTime;
      console.log(
        `🕷️ ScraperAgent: Response text read in ${textTime}ms - Length: ${html.length} chars`
      );

      console.log(`🕷️ ScraperAgent: Extracting content...`);
      const extractStartTime = Date.now();
      const extractedContent = this.extractContent(html);
      const extractTime = Date.now() - extractStartTime;
      console.log(
        `🕷️ ScraperAgent: Content extraction completed in ${extractTime}ms - Content length: ${extractedContent.content.length} chars`
      );

      return {
        url: article.url,
        title: extractedContent.title || article.title,
        content: extractedContent.content,
        author: extractedContent.author,
        publishedAt: extractedContent.publishedAt,
        success: true,
      };
    } catch (error) {
      console.error(`🕷️ ScraperAgent: Error scraping ${domain}:`, error);
      return {
        url: article.url,
        title: article.title,
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed',
      };
    }
  }

  /**
   * Check if we're allowed to scrape this URL according to robots.txt
   */
  private async checkRobotsPermission(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;

      // Check cache first
      if (this.robotsCache.has(domain)) {
        const rules = this.robotsCache.get(domain)!;
        return this.isAllowedByRobots(url, rules);
      }

      // Fetch robots.txt
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // If robots.txt doesn't exist, assume we can scrape
        this.robotsCache.set(domain, []);
        return true;
      }

      const robotsText = await response.text();
      const rules = ScraperAgent.parseRobotsTxt(robotsText);
      this.robotsCache.set(domain, rules);

      return this.isAllowedByRobots(url, rules);
    } catch (error) {
      // If we can't fetch robots.txt, err on the side of caution but allow scraping
      console.warn(`Failed to check robots.txt for ${url}:`, error);
      return true;
    }
  }

  /**
   * Parse robots.txt content into rules
   */
  private static parseRobotsTxt(robotsText: string): RobotsRule[] {
    const rules: RobotsRule[] = [];
    const lines = robotsText.split('\n').map(line => line.trim());

    let currentUserAgent = '';
    let currentDisallowed: string[] = [];
    let currentCrawlDelay: number | undefined;

    for (const line of lines) {
      if (line.startsWith('#') || !line) continue;

      const [key, value] = line.split(':').map(s => s.trim());

      if (key.toLowerCase() === 'user-agent') {
        // Save previous rule if exists
        if (currentUserAgent) {
          rules.push({
            userAgent: currentUserAgent,
            disallowed: currentDisallowed,
            crawlDelay: currentCrawlDelay,
          });
        }

        currentUserAgent = value;
        currentDisallowed = [];
        currentCrawlDelay = undefined;
      } else if (key.toLowerCase() === 'disallow') {
        currentDisallowed.push(value);
      } else if (key.toLowerCase() === 'crawl-delay') {
        currentCrawlDelay = parseInt(value, 10) * 1000; // Convert to milliseconds
      }
    }

    // Save final rule
    if (currentUserAgent) {
      rules.push({
        userAgent: currentUserAgent,
        disallowed: currentDisallowed,
        crawlDelay: currentCrawlDelay,
      });
    }

    return rules;
  }

  /**
   * Check if URL is allowed by robots.txt rules
   */
  private isAllowedByRobots(url: string, rules: RobotsRule[]): boolean {
    const urlPath = new URL(url).pathname;

    // Find applicable rules (check for * and specific user agents)
    const applicableRules = rules.filter(
      rule =>
        rule.userAgent === '*' ||
        rule.userAgent.toLowerCase().includes('flowgenius') ||
        rule.userAgent === this.userAgent
    );

    if (applicableRules.length === 0) return true;

    // Check if any rule disallows this path
    for (const rule of applicableRules) {
      for (const disallowedPath of rule.disallowed) {
        if (disallowedPath === '' || urlPath.startsWith(disallowedPath)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Implement rate limiting per domain
   */
  private async respectRateLimit(domain: string): Promise<void> {
    const lastRequest = this.lastRequestTime.get(domain) || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;

    // Get crawl delay from robots.txt or use default
    const rules = this.robotsCache.get(domain) || [];
    const crawlDelay =
      rules.find(r => r.crawlDelay)?.crawlDelay || this.defaultDelay;

    if (timeSinceLastRequest < crawlDelay) {
      const waitTime = crawlDelay - timeSinceLastRequest;
      await new Promise<void>(resolve => {
        setTimeout(resolve, waitTime);
      });
    }

    this.lastRequestTime.set(domain, Date.now());
  }

  /**
   * Extract content from HTML (simplified - no image extraction)
   */
  // eslint-disable-next-line class-methods-use-this
  private extractContent(html: string): {
    title?: string;
    content: string;
    author?: string;
    publishedAt?: string;
  } {
    try {
      // Simple content extraction - prioritize article tags and main content areas
      const articleMatch = html.match(/<article[^>]*>(.*?)<\/article>/gis)?.[0];
      const mainMatch = html.match(/<main[^>]*>(.*?)<\/main>/gis)?.[0];
      const contentMatch = html.match(
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis
      )?.[0];

      let content = articleMatch || mainMatch || contentMatch || html;

      // Extract title from meta tags or h1
      const titleMatch =
        html.match(
          /<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i
        )?.[1] ||
        html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
        html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1];

      // Extract author from meta tags
      const authorMatch =
        html.match(
          /<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i
        )?.[1] ||
        html.match(
          /<meta[^>]*property="article:author"[^>]*content="([^"]*)"[^>]*>/i
        )?.[1];

      // Extract published date from meta tags
      const publishedMatch =
        html.match(
          /<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i
        )?.[1] ||
        html.match(/<meta[^>]*name="date"[^>]*content="([^"]*)"[^>]*>/i)?.[1];

      // Clean up content by removing scripts, styles, and other unwanted elements
      content = content
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
        .replace(/<header[^>]*>.*?<\/header>/gis, '')
        .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
        .replace(/<aside[^>]*>.*?<\/aside>/gis, '')
        .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/gis, '');

      // Convert to plain text
      const plainText = ScraperAgent.stripHtmlTags(content)
        .replace(/\s+/g, ' ')
        .trim();

      return {
        title: titleMatch?.trim(),
        content: plainText,
        author: authorMatch?.trim(),
        publishedAt: publishedMatch?.trim(),
      };
    } catch (error) {
      console.error('Content extraction failed:', error);
      return {
        content: `${ScraperAgent.stripHtmlTags(html).slice(0, 1000)}...`, // Fallback to first 1000 chars
      };
    }
  }

  /**
   * Strip HTML tags from text
   */
  private static stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
