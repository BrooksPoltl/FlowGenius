/**
 * News Curator LangGraph Implementation
 * Orchestrates the news curation workflow using LangGraph state management
 */

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { settingsAgent } from './agents/settings';
import { searchAgent } from './agents/search';
import { curationAgent } from './agents/curation';
import { topicExtractorAgent } from './agents/topic_extractor';
import { rankingAgent } from './agents/ranking';

// Define the state schema using Annotation.Root()
const NewsCuratorState = Annotation.Root({
  // Settings phase
  userInterests: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
  }),
  settingsLoaded: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),

  // Search phase
  searchResults: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
  }),
  searchComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),

  // Curation phase
  curatedArticles: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
  }),
  curationComplete: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  duplicatesFiltered: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),
  newArticlesSaved: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Topic extraction phase
  topicsExtracted: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  topicsExtractedCount: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Ranking phase
  articlesRanked: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
  }),
  rankedCount: Annotation<number>({
    reducer: (current, update) => update ?? current,
  }),

  // Error handling
  error: Annotation<string>({
    reducer: (current, update) => update ?? current,
  }),
});

// Create the state graph
const workflow = new StateGraph(NewsCuratorState)
  .addNode('settings', settingsAgent)
  .addNode('search', searchAgent)
  .addNode('curate', curationAgent)
  .addNode('extract_topics', topicExtractorAgent)
  .addNode('rank', rankingAgent)
  .addEdge(START, 'settings')
  .addEdge('settings', 'search')
  .addEdge('search', 'curate')
  .addEdge('curate', 'extract_topics')
  .addEdge('extract_topics', 'rank')
  .addEdge('rank', END);

// Compile the graph
export const newsCuratorGraph = workflow.compile();

/**
 * Runs the complete news curation workflow
 * @returns Promise with the final state containing all results
 */
export async function runNewsCuration(): Promise<any> {
  try {
    console.log('Starting news curation workflow...');

    const initialState = {
      userInterests: [],
      settingsLoaded: false,
      searchResults: [],
      searchComplete: false,
      curatedArticles: [],
      curationComplete: false,
      duplicatesFiltered: 0,
      newArticlesSaved: 0,
      topicsExtracted: false,
      topicsExtractedCount: 0,
      articlesRanked: false,
      rankedCount: 0,
    };

    const result = await newsCuratorGraph.invoke(initialState);

    console.log('News curation workflow completed successfully');
    console.log('Final stats:', {
      interests: result.userInterests?.length || 0,
      searchResults: result.searchResults?.length || 0,
      curatedArticles: result.curatedArticles?.length || 0,
      duplicatesFiltered: result.duplicatesFiltered || 0,
      newArticlesSaved: result.newArticlesSaved || 0,
      topicsExtracted: result.topicsExtractedCount || 0,
      articlesRanked: result.rankedCount || 0,
    });

    return result;
  } catch (error) {
    console.error('Error in news curation workflow:', error);
    throw error;
  }
}
