# Phase 0: Core MVP Implementation Plan (Revised)

This document breaks down the tasks required to build the foundational Minimum Viable Product (MVP) for the AI-Powered Personalized News Curator. The goal is to deliver an interactive news reader that establishes the core architecture and allows users to manage their interests from the start.

## Backend

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Database & Settings Initialization** | On app start, ensure the SQLite database file exists. `SettingsService` checks if initial setup is done. If not, seed `Interests` with a default list, which the user can immediately edit. | `src/main/db/index.ts`, `src/main/services/settings.ts` | - | ☐ |
| **P0** | **CRUD IPC for Interests** | Create `ipcMain` handlers for managing interests: `get-interests` (fetch all), `add-interest` (add one, prevent duplicates), and `delete-interest` (remove one). These will be called from the new frontend modal. | `src/main/services/settings.ts`, `src/main/index.ts` | Database Setup | ☐ |
| **P0** | **Implement `SettingsAgent`** | Create the first agent in the graph. This agent will be responsible for reading the user's interests from the `Interests` table. It will now get the user-curated list instead of just the default seeded one. | `src/main/services/news_curator/agents/settings.ts` (new file) | CRUD IPC for Interests | ☐ |
| **P0** | **Implement `SearchAgent`** | Create the agent that receives topics from `SettingsAgent` and queries the Brave Search API to fetch news articles for each topic. The agent should handle API key management securely (via environment variables). | `src/main/services/news_curator/agents/search.ts` | `SettingsAgent` | ☐ |
| **P0** | **Implement `CurationAgent`**| This agent receives articles, de-duplicates by checking URLs against the `Articles` table, and saves new ones to the database. | `src/main/services/news_curator/agents/curation.ts` | `SearchAgent` | ☐ |
| **P0** | **Assemble Core Graph** | Wire the agents together (`SettingsAgent` -> `SearchAgent` -> `CurationAgent`) in the main LangGraph instance. | `src/main/services/news_curator/graph.ts` | All P0 Agents | ☐ |
| **P0** | **Create IPC Handler for News** | Create `get-daily-news` IPC handler to trigger the core LangGraph and return the resulting list of articles. | `src/main/index.ts` | Core Graph | ☐ |

## Frontend

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Interests Modal Component** | **(New Task)** Create a modal component for managing interests. It will fetch interests on open, display them in a list with delete buttons, and have an input field to add new ones. | `src/renderer/components/InterestsModal.tsx` (new file) | - | ☐ |
| **P0** | **Article Card Component** | Create a reusable React component to display a single news article, showing its title, source, and a brief snippet. | `src/renderer/components/ui/ArticleCard.tsx` (new file) | - | ☐ |
| **P0** | **Main Briefing Screen** | Modify the main screen. Add a "Manage Interests" button to open the `InterestsModal`. The "Get Latest News" button remains. | `src/renderer/screens/main.tsx` | `InterestsModal` | ☐ |
| **P0** | **Bridge API for Interests & News** | Expose all required IPC channels through the preload script: `get-daily-news`, `get-interests`, `add-interest`, `delete-interest`. | `src/preload/index.ts` | Backend IPC Handlers | ☐ |
| **P0** | **Connect Modal and Data Fetch**| Wire up the `InterestsModal` to use the bridge APIs for CRUD operations. The "Get Latest News" button's `onClick` handler remains the same. | `src/renderer/screens/main.tsx`, `src/renderer/components/InterestsModal.tsx` | Bridge API | ☐ | 