# P5: Executive Summary Feature

## Vision

To elevate the user experience by providing a high-level, AI-generated "executive summary" for each daily news briefing. This feature transforms FlowGenius from a simple list of articles into a personalized, "Morning Brew"-style digest. The summary will be witty, insightful, and structured, allowing users to quickly grasp the most important news of the day while providing clear citations to dive deeper.

## Important Implementation Details

This feature introduces a more sophisticated, asynchronous architecture to handle computationally intensive AI tasks without compromising the user's experience.

1.  **Ranked-First Delivery**: The user will never see an unranked list of articles. The application will wait until the initial personalization and ranking are complete before displaying any content.

2.  **Asynchronous Summary Generation**: To avoid a long initial loading time, the most resource-intensive tasks (`Scraping` and `Summarization`) will run as a non-blocking background process after the ranked articles have already been displayed to the user.

3.  **Progressive UI Loading**: The UI will reflect the background processing. The "Summary" tab will initially appear in a disabled/loading state. Once the background summarization is complete, an IPC event will trigger the UI to update, populating the tab with the generated content.

4.  **Ethical Scraping**: A new `ScraperAgent` will be introduced to fetch full article text for summarization. It will operate under a strict ethical framework, which includes respecting `robots.txt`, identifying itself with a clear `User-Agent`, and employing rate-limiting to avoid harming publisher sites.

5.  **Atomic Database Writes**: All new data for a briefing (extracted topics, personalization scores, and the final summary) will be saved in a single, atomic database transaction at the end of the workflow. This ensures data consistency and efficiency.

---

### Implementation Plan

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **DB: Add `summary_json` to Briefings** | Add a `summary_json` TEXT column to the `Briefings` table to store the structured JSON output from the SummarizerAgent. | `src/main/db/schema.ts` | --- | [ ] |
| **High** | **DB: Create Migration for Summary** | Create a new migration file to safely add the `summary_json` column to the `Briefings` table for existing users. | `src/main/db/migrations/003_add_summary_to_briefings.ts` | Add `summary_json` to Briefings | [ ] |
| **High** | **Backend: Implement `ScraperAgent`** | Create a new agent that scrapes the main text content of an article. It must respect `robots.txt`, set a custom `User-Agent`, and handle failures (paywalls, errors) gracefully by returning an empty string. | `src/main/services/news_curator/agents/scraper.ts` | --- | [ ] |
| **High** | **Backend: Implement `SummarizerAgent`** | Create a new agent that takes the ranked articles and their scraped text. It will use a carefully engineered prompt to generate a structured JSON object containing a witty, multi-part summary, headlines, citations, and image URLs. | `src/main/services/news_curator/agents/summarizer.ts` | `ScraperAgent` | [ ] |
| **High** | **Backend: Update LangGraph Workflow** | Modify the main graph (`src/main/services/news_curator/graph.ts`) to implement the new "Ranked-First" architecture. The flow will be: `... -> RankingAgent -> [Emit Ranked Articles to UI] -> ScraperAgent -> SummarizerAgent -> [Final DB Write]`. | `src/main/services/news_curator/graph.ts` | All new agents | [ ] |
| **High** | **Backend: Create `DatabaseWriterAgent`** | Create a final agent in the graph that takes the completed state (with topics, scores, and summary) and performs a single, atomic database transaction to save all new information. | `src/main/services/news_curator/agents/database_writer.ts` | LangGraph Workflow Update | [ ] |
| **High** | **IPC: Add `summary-ready` Event** | After the final database write, the main process will emit a `summary-ready` event to the renderer process, signaling that the summary for a specific `briefing_id` is now available. | `src/main/index.ts` | `DatabaseWriterAgent` | [ ] |
| **Medium** | **Frontend: Implement Tabbed UI** | In the main news view screen, replace the current layout with a tabbed interface. There will be two tabs: "Articles" and "Summary". The "Articles" tab will be the default. | `src/renderer/screens/main.tsx` | --- | [ ] |
| **Medium** | **Frontend: Create `SummaryView` Component** | Create a new React component to render the executive summary. It will receive the `summary_json` and display it in a well-designed, modern format, including headlines, text, and images. | `src/renderer/components/SummaryView.tsx` | Tabbed UI | [ ] |
| **Medium** | **Frontend: Handle Loading State** | The "Summary" tab should be visible upon article load but display a loading indicator (e.g., a spinner with text like "Generating your executive summary..."). It will listen for the `summary-ready` IPC event. | `src/renderer/screens/main.tsx` | `SummaryView` Component, `summary-ready` Event | [ ] |
| **Medium** | **Frontend: Update State Management** | The frontend state will now need to handle the two-stage data load: first the ranked articles, then the summary object. The UI will re-render when the summary arrives. | `src/renderer/screens/main.tsx` | Tabbed UI, `summary-ready` Event | [ ] |
| **Low** | **Documentation: Update Feature Docs** | Document the new architecture, agents, and UI flow in a new markdown file. | `feature_docs/P5_EXECUTIVE_SUMMARY.md` | Entire feature completion | [ ] | 