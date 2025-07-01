/**
 * News Curator Workflow - Orchestrates the news curation workflow
 * Connects SettingsAgent -> SearchAgent -> CurationAgent
 */

import { settingsAgent } from './agents/settings';
import { searchAgent } from './agents/search';
import { curationAgent, CurationState } from './agents/curation';

/**
 * Runs the complete news curation workflow
 * Sequential execution: SettingsAgent -> SearchAgent -> CurationAgent
 * @returns Final state with curated articles
 */
export async function runNewsCuration(): Promise<CurationState> {
  try {
    console.log('Starting news curation workflow...');

    // Step 1: Get user interests
    console.log('Running SettingsAgent...');
    const settingsResult = await settingsAgent();

    if (settingsResult.error) {
      throw new Error(settingsResult.error);
    }

    // Step 2: Search for articles
    console.log('Running SearchAgent...');
    const searchResult = await searchAgent(settingsResult);

    if (searchResult.searchErrors && searchResult.searchErrors.length > 0) {
      console.warn('Search errors occurred:', searchResult.searchErrors);
    }

    // Step 3: Curate and save articles
    console.log('Running CurationAgent...');
    const curationResult = await curationAgent(searchResult);

    console.log('News curation workflow completed');
    console.log(
      `Results: ${curationResult.savedCount} new articles, ${curationResult.duplicateCount} duplicates`
    );

    return curationResult;
  } catch (error) {
    console.error('Error in news curation workflow:', error);
    throw error;
  }
}
