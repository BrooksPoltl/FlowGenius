# P1: Personalization Engine Implementation Plan

This document outlines the tasks required to build the Personalization Engine for FlowGenius. This feature introduces topic extraction, article ranking based on user affinity, and a background learning loop to improve personalization over time.

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Database: Update Schema** | Add new tables: `Topics`, `Article_Topics`, `TopicAffinities`, `Interactions`. Update `Articles` table to include a `personalization_score`. Create a new migration file to apply these changes. | `src/main/db/schema.ts` <br/> `src/main/db/index.ts` (for migration logic) | - | ✅ Done |
| **P0** | **Backend: `TopicExtractorAgent`** | Create a new agent that takes a list of articles. For each article, use OpenAI's `gpt-4o-mini` to extract relevant topics. Use function calling/tool usage with the LLM to ensure structured output. Store topics in the `Topics` table and link them to articles in `Article_Topics`. | `src/main/services/news_curator/agents/topic_extractor.ts` (new) <br/> `src/main/db/` | Database Schema Update | ✅ Done |
| **P0** | **Backend: `RankingAgent`** | Create a new agent that calculates a `personalization_score` for each article. The score should be based on the sum of `affinity_score` for each of an article's topics. Update the `personalization_score` in the `Articles` table. | `src/main/services/news_curator/agents/ranking.ts` (new) | `TopicExtractorAgent` | ✅ Done |
| **P0** | **Backend: LangGraph Workflow Update** | Integrate the new `TopicExtractorAgent` and `RankingAgent` into the main news curation graph. The new flow will be: `Settings` -> `Search` -> `Curation` -> `TopicExtractor` -> `Ranking`. | `src/main/services/news_curator/graph.ts` | `TopicExtractorAgent`, `RankingAgent` | ✅ Done |
| **P0** | **Backend: IPC for Interactions** | Create a new IPC handler `handle-interaction` that takes `article_id` and `interaction_type` ('click', 'like', 'dislike'). This handler will save the interaction to the `Interactions` table and trigger the `AffinityAgent`. | `src/main/index.ts` | Database Schema Update | ✅ Done |
| **P0** | **Backend: `AffinityAgent`** | Create the `AffinityAgent`. This agent is triggered by the `handle-interaction` IPC. It will find the topics for the interacted article and update the `TopicAffinities` table. `like` increases score, `dislike` decreases it. Clicks can be a smaller positive signal. | `src/main/services/news_curator/agents/affinity.ts` (new) | IPC for Interactions | ✅ Done |
| **P1** | **Frontend: Add Interaction Buttons** | Add "Like" (thumbs up) and "Dislike" (thumbs down) buttons to the `ArticleCard` component. | `src/renderer/components/ui/ArticleCard.tsx` | - | ✅ Done |
| **P1** | **Frontend: Wire up Interaction Buttons** | Connect the new buttons to the `handle-interaction` IPC handler via the preload bridge. When a button is clicked, send the `article_id` and interaction type to the backend. Also handle click-throughs as a 'click' interaction. | `src/renderer/components/ui/ArticleCard.tsx` <br/> `src/preload/index.ts` | Backend: IPC for Interactions | ✅ Done |
| **P1** | **Frontend: Display Ranked Articles** | Modify the `get-daily-news` IPC handler and the frontend to fetch and display articles sorted by their new `personalization_score` in descending order. | `src/renderer/screens/main.tsx` <br/> `src/main/index.ts` | Backend: LangGraph Workflow Update | ✅ Done |
| **P2** | **Ops: Add OpenAI API Key to Env** | Add `OPENAI_API_KEY` to the `.env` file and the corresponding check in the `TopicExtractorAgent`. Update documentation. | `.env` <br/> `src/main/services/news_curator/agents/topic_extractor.ts` | - | ✅ Done |

## Implementation Summary

**All P1 Personalization Engine tasks have been completed! 🎉**

### Key Features Implemented:

1. **Database Schema Updates**: Added 5 new tables for personalization (Topics, Article_Topics, TopicAffinities, Interactions, plus updated Articles table)

2. **AI-Powered Topic Extraction**: Using OpenAI's `gpt-4o-mini` to extract 3-5 relevant topics per article with structured output

3. **Personalization Scoring**: Articles are ranked based on user's topic affinities with weighted relevance scores

4. **Learning from User Interactions**: 
   - Like/Dislike buttons with visual feedback
   - Click tracking for article engagement
   - Affinity learning algorithm with configurable weights (Like: +1.0, Dislike: -1.0, Click: +0.2)

5. **Updated LangGraph Workflow**: 
   - Settings → Search → Curation → TopicExtractor → Ranking
   - Proper state management with all agents integrated

6. **Enhanced Frontend**:
   - Modern article cards with interaction buttons
   - Personalization scores displayed for debugging
   - Articles sorted by relevance score
   - Detailed stats showing extraction and ranking metrics

### API Keys Required:
- `BRAVE_SEARCH_API_KEY`: For news fetching
- `OPENAI_API_KEY`: For topic extraction

### Next Steps:
The personalization engine is ready for testing! Users can now:
1. Set up API keys in `.env` file
2. Run the app and fetch news
3. Like/dislike articles to train the system
4. See personalized rankings improve over time

The system will learn from user interactions and progressively improve article recommendations based on their preferences. 