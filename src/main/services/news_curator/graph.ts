/**
 * News Curator Workflow - Orchestrates the news curation workflow using LangGraph
 * Connects SettingsAgent -> SearchAgent -> CurationAgent
 */
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';

import { settingsAgent } from './agents/settings';
import { searchAgent, Article } from './agents/search';
import { curationAgent } from './agents/curation';

/**
 * Define the state schema for the news curation graph
 * This represents the data that flows through the entire workflow
 */
const NewsStateAnnotation = Annotation.Root({
  // User interests from database
  interests: Annotation<string[]>({
    value: (x: string[], y: string[]) => y,
    default: () => [],
  }),
  // Raw articles from search
  articles: Annotation<Article[]>({
    value: (x: Article[], y: Article[]) => y,
    default: () => [],
  }),
  // Curated articles after deduplication and saving
  curatedArticles: Annotation<Article[]>({
    value: (x: Article[], y: Article[]) => y,
    default: () => [],
  }),
  // Statistics
  savedCount: Annotation<number>({
    value: (x: number, y: number) => y,
    default: () => 0,
  }),
  duplicateCount: Annotation<number>({
    value: (x: number, y: number) => y,
    default: () => 0,
  }),
  // Error handling
  error: Annotation<string | undefined>({
    value: (x: string | undefined, y: string | undefined) => y,
    default: () => undefined,
  }),
  searchErrors: Annotation<string[] | undefined>({
    value: (x: string[] | undefined, y: string[] | undefined) => y,
    default: () => undefined,
  }),
});

// Create the StateGraph
const newsGraph = new StateGraph(NewsStateAnnotation)
  .addNode('settings', settingsAgent)
  .addNode('search', searchAgent)
  .addNode('curate', curationAgent)
  .addEdge(START, 'settings')
  .addEdge('settings', 'search')
  .addEdge('search', 'curate')
  .addEdge('curate', END);

// Compile the graph
const compiledGraph = newsGraph.compile();

/**
 * Runs the complete news curation workflow using LangGraph
 * @returns Final state with curated articles
 */
export async function runNewsCuration() {
  try {
    console.log('Starting news curation workflow with LangGraph...');

    // Invoke the compiled graph with empty initial state
    const finalState = await compiledGraph.invoke({});

    console.log('News curation workflow completed.');
    console.log(
      `Results: ${finalState.savedCount} new articles, ${finalState.duplicateCount} duplicates`
    );

    return {
      curatedArticles: finalState.curatedArticles,
      savedCount: finalState.savedCount,
      duplicateCount: finalState.duplicateCount,
      searchErrors: finalState.searchErrors || [],
    };
  } catch (error) {
    console.error('Error in news curation workflow:', error);
    throw error;
  }
}
