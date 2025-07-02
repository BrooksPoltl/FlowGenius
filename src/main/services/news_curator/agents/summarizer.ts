/**
 * SummarizerAgent: Generates executive summaries from article content
 * Creates Morning Brew style briefings with witty, conversational tone
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
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

interface ExecutiveSummary {
  title: string;
  subtitle: string;
  mainStories: MainStory[];
  quickBites: QuickBite[];
  images: SummaryImage[];
  citations: Citation[];
  generatedAt: string;
}

interface MainStory {
  headline: string;
  summary: string;
  keyTakeaway: string;
  citations: string[]; // URLs
}

interface QuickBite {
  headline: string;
  oneLineSummary: string;
  citation: string; // URL
}

interface SummaryImage {
  url: string;
  caption: string;
  sourceUrl: string;
}

interface Citation {
  url: string;
  title: string;
  source: string;
}

/**
 * Generates executive summaries from scraped article content
 * Uses AI to create engaging, Morning Brew style briefings
 */
export class SummarizerAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  /**
   * Strip markdown code blocks from AI response and parse JSON
   */
  private parseAIResponse(response: string): any {
    // Remove markdown code blocks if present
    let cleanResponse = response.trim();
    
    // Remove ```json and ``` markers
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return JSON.parse(cleanResponse.trim());
  }

  /**
   * Generate executive summary from scraped content and original articles
   */
  async generateSummary(
    scrapedContent: ScrapedContent[],
    originalArticles: Article[],
    topics: string[]
  ): Promise<ExecutiveSummary> {
    // Filter successful scrapes and prepare content
    const successfulScrapes = scrapedContent.filter(
      content => content.success && content.content
    );

    if (successfulScrapes.length === 0) {
      // Fallback to original article data if no scrapes succeeded
      return this.generateFallbackSummary(originalArticles, topics);
    }

    // Generate main stories (top 3-5 most important articles)
    const mainStories = await this.generateMainStories(
      successfulScrapes,
      topics
    );

    // Generate quick bites (remaining articles)
    const remainingContent = successfulScrapes.slice(mainStories.length);
    const quickBites = await this.generateQuickBites(remainingContent);

    // Extract images and citations
    const images = this.extractImages(scrapedContent, originalArticles);
    const citations = this.generateCitations(originalArticles);

    // Generate engaging title and subtitle
    const { title, subtitle } = await this.generateTitleAndSubtitle(
      topics,
      mainStories
    );

    return {
      title,
      subtitle,
      mainStories,
      quickBites,
      images,
      citations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate main stories from the most important articles
   */
  private async generateMainStories(
    scrapedContent: ScrapedContent[],
    topics: string[]
  ): Promise<MainStory[]> {
    // Take top 4 articles for main stories
    const topContent = scrapedContent.slice(0, 4);

    const prompt = PromptTemplate.fromTemplate(`
You are writing the main stories section of a Morning Brew style executive summary. 
Create engaging, witty summaries that are informative yet conversational.

Topics of interest: {topics}

Articles to summarize:
{articles}

For each article, create a main story with:
1. A catchy, engaging headline (not just the original title)
2. A 2-3 sentence summary that captures the key points with personality
3. A one-sentence key takeaway that explains why this matters

Write in Morning Brew's signature style:
- Conversational and witty tone
- Use "you" to address the reader
- Include relevant context and implications
- Make complex topics accessible
- Add personality without being unprofessional

Return the response as a JSON array of objects with fields: headline, summary, keyTakeaway, citations (array of URLs).
`);

    const articlesText = topContent
      .map(
        (content, index) =>
          `Article ${index + 1}:
Title: ${content.title}
URL: ${content.url}
Content: ${content.content.slice(0, 1000)}...
`
      )
      .join('\n\n');

    try {
      const response = await this.llm.invoke(
        await prompt.format({
          topics: topics.join(', '),
          articles: articlesText,
        })
      );

      const parsed = this.parseAIResponse(response.content as string);
      return parsed.map((story: any, index: number) => ({
        ...story,
        citations: [topContent[index].url],
      }));
    } catch (error) {
      console.error('Error generating main stories:', error);
      // Fallback to simple summaries
      return topContent.map(content => ({
        headline: content.title,
        summary: `${content.content.slice(0, 200)}...`,
        keyTakeaway:
          'This story provides important updates in your areas of interest.',
        citations: [content.url],
      }));
    }
  }

  /**
   * Generate quick bites from remaining articles
   */
  private async generateQuickBites(
    scrapedContent: ScrapedContent[]
  ): Promise<QuickBite[]> {
    if (scrapedContent.length === 0) return [];

    const prompt = PromptTemplate.fromTemplate(`
You are writing the "Quick Bites" section of a Morning Brew style executive summary.
These are shorter, snappier summaries of secondary stories.

Articles to summarize:
{articles}

For each article, create a quick bite with:
1. A punchy headline (different from the original title)
2. A single sentence that captures the essence with personality

Keep the Morning Brew style:
- Witty and conversational
- Concise but informative
- Add context when helpful
- Make it engaging to read

Return as JSON array with fields: headline, oneLineSummary, citation (URL).
`);

    const articlesText = scrapedContent
      .map(
        (content, index) =>
          `Article ${index + 1}:
Title: ${content.title}
URL: ${content.url}
Content: ${content.content.slice(0, 500)}...
`
      )
      .join('\n\n');

    try {
      const response = await this.llm.invoke(
        await prompt.format({
          articles: articlesText,
        })
      );

      const parsed = this.parseAIResponse(response.content as string);
      return parsed.map((bite: any, index: number) => ({
        ...bite,
        citation: scrapedContent[index].url,
      }));
    } catch (error) {
      console.error('Error generating quick bites:', error);
      // Fallback to simple summaries
      return scrapedContent.map(content => ({
        headline: content.title,
        oneLineSummary: `${content.content.slice(0, 100)}...`,
        citation: content.url,
      }));
    }
  }

  /**
   * Generate engaging title and subtitle for the summary
   */
  private async generateTitleAndSubtitle(
    topics: string[],
    mainStories: MainStory[]
  ): Promise<{ title: string; subtitle: string }> {
    const prompt = PromptTemplate.fromTemplate(`
You are creating the title and subtitle for a Morning Brew style executive summary.

Topics covered: {topics}
Main story headlines: {headlines}

Create:
1. A catchy title that captures the day's theme (like "Tech Turbulence Tuesday" or "Market Mayhem Monday")
2. A witty subtitle that sets the tone and gives a preview

Keep it:
- Engaging and memorable
- Professional but fun
- Relevant to the content
- In Morning Brew's signature style

Return as JSON with fields: title, subtitle
`);

    try {
      const response = await this.llm.invoke(
        await prompt.format({
          topics: topics.join(', '),
          headlines: mainStories.map(story => story.headline).join(', '),
        })
      );

      const parsed = this.parseAIResponse(response.content as string);
      return {
        title: parsed.title || 'Your Daily Briefing',
        subtitle: parsed.subtitle || 'Top stories curated for your interests',
      };
    } catch (error) {
      console.error('Error generating title and subtitle:', error);
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return {
        title: `Your Daily Briefing - ${date}`,
        subtitle: 'Top stories curated for your interests',
      };
    }
  }

  /**
   * Extract images from Brave Search thumbnail URLs (no scraping needed)
   */
  private extractImages(
    scrapedContent: ScrapedContent[],
    originalArticles: Article[]
  ): SummaryImage[] {
    const images: SummaryImage[] = [];

    // Use thumbnail URLs from Brave Search API - these are already high quality
    originalArticles.forEach(article => {
      if (article.imageUrl) {
        images.push({
          url: article.imageUrl,
          caption: article.title,
          sourceUrl: article.url,
        });
      }
    });

    // Return top 5 images
    return images.slice(0, 5);
  }

  /**
   * Generate citations from original articles
   */
  private generateCitations(originalArticles: Article[]): Citation[] {
    return originalArticles.map(article => ({
      url: article.url,
      title: article.title,
      source: this.extractSourceName(article.url),
    }));
  }

  /**
   * Extract source name from URL
   */
  private extractSourceName(url: string): string {
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown Source';
    }
  }

  /**
   * Generate fallback summary when scraping fails
   */
  private generateFallbackSummary(
    originalArticles: Article[],
    _topics: string[] // Prefix with underscore to indicate intentionally unused
  ): ExecutiveSummary {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    // Create simple main stories from top articles
    const mainStories: MainStory[] = originalArticles
      .slice(0, 3)
      .map(article => ({
        headline: article.title,
        summary:
          article.description ||
          'Full content not available, but this story caught our attention in your areas of interest.',
        keyTakeaway:
          'This story provides important updates in your areas of interest.',
        citations: [article.url],
      }));

    // Create quick bites from remaining articles
    const quickBites: QuickBite[] = originalArticles.slice(3).map(article => ({
      headline: article.title,
      oneLineSummary:
        article.description || 'Another story worth your attention.',
      citation: article.url,
    }));

    return {
      title: `Your ${date} Briefing`,
      subtitle: 'The stories that matter to you, curated just for you.',
      mainStories,
      quickBites,
      images: this.extractImages([], originalArticles),
      citations: this.generateCitations(originalArticles),
      generatedAt: new Date().toISOString(),
    };
  }
}
