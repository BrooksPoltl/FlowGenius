/**
 * Article Clustering Agent
 * Groups articles by topic and assigns news significance scores using AI
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { Article } from '../../../../shared/types';

/**
 * Schema for AI-generated clustering results
 */
const ClusteringResultSchema = z.object({
  clusters: z.array(
    z.object({
      cluster_id: z
        .string()
        .describe('Unique identifier for this topic cluster'),
      topic: z.string().describe('Main topic or theme of this cluster'),
      articles: z.array(
        z.object({
          url: z.string().describe('Article URL'),
          significance_score: z
            .number()
            .min(0)
            .max(1)
            .describe('News significance score from 0.0 to 1.0'),
        })
      ),
    })
  ),
});

type ClusteringResult = z.infer<typeof ClusteringResultSchema>;

/**
 * Article clustering agent that groups articles by topic and assigns significance scores
 */
export async function articleClusteringAgent(state: {
  curatedArticles: Article[];
  curationComplete: boolean;
}): Promise<{
  clusteredArticles: Article[];
  clusteringComplete: boolean;
  articleClustersFound: number;
}> {
  console.log(
    '🔗 ArticleClusteringAgent: Starting article clustering and scoring'
  );

  if (!state.curatedArticles || state.curatedArticles.length === 0) {
    console.log('🔗 ArticleClusteringAgent: No articles to cluster');
    return {
      clusteredArticles: [],
      clusteringComplete: true,
      articleClustersFound: 0,
    };
  }

  try {
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2000,
    });

    const prompt = PromptTemplate.fromTemplate(`
You are a news analysis expert. Your task is to:
1. Group articles by similar topics/themes
2. Assign a "news significance score" (0.0-1.0) to each article based on how important/impactful the news is

News significance criteria:
- 1.0: Major breaking news, significant policy changes, major corporate announcements
- 0.8: Important developments, notable market movements, significant tech releases
- 0.6: Moderate news, industry updates, minor policy changes
- 0.4: Routine announcements, minor updates, niche industry news
- 0.2: Opinion pieces, minor updates, very niche content
- 0.0: Irrelevant or spam content

Articles to analyze:
{articles}

Group related articles into clusters and assign significance scores. Each cluster should have a clear topic theme.
Return the results in the specified JSON format.
`);

    const articlesText = state.curatedArticles
      .map(
        (article, index) =>
          `${index + 1}. Title: "${article.title}"
   URL: ${article.url}
   Description: ${article.description}
   Source: ${article.source}
   Published: ${article.publishedAt}
`
      )
      .join('\n');

    console.log(
      `🔗 ArticleClusteringAgent: Analyzing ${state.curatedArticles.length} articles`
    );

    const structuredLlm = llm.withStructuredOutput(ClusteringResultSchema);
    const response = await structuredLlm.invoke(
      await prompt.format({
        articles: articlesText,
      })
    );

    const clusteringResult = response as ClusteringResult;

    console.log(
      `🔗 ArticleClusteringAgent: Found ${clusteringResult.clusters.length} clusters`
    );

    // Map the clustering results back to the original articles
    const clusteredArticles: Article[] = [];
    const urlToClusterMap = new Map<
      string,
      { cluster_id: string; significance_score: number }
    >();

    // Build URL mapping from clustering results
    clusteringResult.clusters.forEach(cluster => {
      cluster.articles.forEach(article => {
        urlToClusterMap.set(article.url, {
          cluster_id: cluster.cluster_id,
          significance_score: article.significance_score,
        });
      });
    });

    // Update original articles with clustering data
    state.curatedArticles.forEach(article => {
      const clusterData = urlToClusterMap.get(article.url);
      if (clusterData) {
        clusteredArticles.push({
          ...article,
          cluster_id: clusterData.cluster_id,
          significance_score: clusterData.significance_score,
        });
      } else {
        // Fallback for articles not found in clustering results
        clusteredArticles.push({
          ...article,
          cluster_id: `cluster_${Date.now()}_${Math.random()}`,
          significance_score: 0.5, // Default moderate significance
        });
      }
    });

    console.log(
      `🔗 ArticleClusteringAgent: Successfully clustered ${clusteredArticles.length} articles`
    );

    // Log cluster summary
    const clusterSummary = clusteringResult.clusters.map(cluster => ({
      cluster_id: cluster.cluster_id,
      topic: cluster.topic,
      article_count: cluster.articles.length,
      avg_significance:
        cluster.articles.reduce((sum, a) => sum + a.significance_score, 0) /
        cluster.articles.length,
    }));

    console.log('🔗 ArticleClusteringAgent: Cluster summary:', clusterSummary);

    return {
      clusteredArticles,
      clusteringComplete: true,
      articleClustersFound: clusteringResult.clusters.length,
    };
  } catch (error) {
    console.error('🔗 ArticleClusteringAgent: Error during clustering:', error);

    // Fallback: assign default clustering to all articles
    const fallbackClusters = state.curatedArticles.map(article => ({
      ...article,
      cluster_id: `fallback_${Date.now()}`,
      significance_score: 0.5,
    }));

    return {
      clusteredArticles: fallbackClusters,
      clusteringComplete: true,
      articleClustersFound: 1,
    };
  }
}
