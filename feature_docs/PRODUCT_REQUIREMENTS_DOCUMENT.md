# Product Requirements Document: AI-Powered Personalized News Curator

## 1. Overview

This document outlines the requirements for a new desktop application feature: an intelligent, AI-powered Personalized News Curator. The feature will provide users with a daily news briefing tailored to their specific interests. It will be built using an agentic architecture powered by LangGraph, with the Brave Search API as its primary data source and a local SQLite database for persistence and learning. The system is designed to learn from user feedback over time to continuously improve the quality and relevance of its curation.

## 2. Problem Statement

Users are inundated with a high volume of information from countless sources, making it difficult and time-consuming to stay informed on the specific topics that matter most to them. Standard news feeds are often generic, filled with clickbait, and fail to adapt to a user's nuanced or evolving interests. There is a need for a "smart" news client that actively works to filter out the noise and deliver a concise, relevant, and personalized briefing that improves with use.

## 3. Core Objectives

*   **Build a Foundational MVP:** Deliver a functional core experience that fetches, curates, and displays news based on a user's declared interests.
*   **Implement a Learning System:** Create a robust feedback loop where the system learns from user interactions (clicks, likes, dislikes) to personalize the news feed algorithmically.
*   **Establish a Scalable Architecture:** Use LangGraph to build a modular, agent-based system that is easy to debug, maintain, and extend with more advanced AI capabilities in the future.
*   **Ensure User Trust:** Provide transparency into the learning process by allowing users to view their own learned "affinity scores" for various topics.

## 4. Technical Stack

*   **Application Framework:** Electron
*   **Frontend Library:** React (with TypeScript)
*   **AI Workflow Engine:** LangGraph
*   **Primary Data Source:** Brave Search API (for Web, News, and Summarization)
*   **Local Database:** SQLite (via `better-sqlite3`)

## 5. System Workflows

The application will operate based on two primary, interconnected LangGraph workflows.

### Workflow 1: The Daily News Run

This is the primary, user-facing workflow that runs daily or on-demand to generate the news briefing.

1.  **`SettingsAgent`**: Reads the user's followed topics and learned affinity scores from the SQLite database.
2.  **`SearchAgent`**: Takes the topics and queries the Brave Search API to fetch relevant articles.
3.  **`CurationAgent`**: Deduplicates the fetched articles by checking their URLs against the local database cache. Stores new articles.
4.  **`TopicExtractorAgent`**: (P1) Uses an LLM to analyze each new article, identifying and storing primary and tangential topics for future learning.
5.  **`RankingAgent`**: (P1) Re-orders the curated list of articles based on the user's learned affinity scores for the topics associated with each article.
6.  **`SummarizerAgent`**: (Stretch) Calls the Brave Summarizer API on the top-ranked articles to generate a concise executive summary for the day.

### Workflow 2: The Background Learning Loop

This workflow runs periodically and asynchronously in the background to make the system smarter.

1.  **`FeedbackFetchAgent`**: Queries the database for new user interactions (likes/dislikes) that have not yet been processed.
2.  **`AffinityAgent`**: Processes these interactions to update the user's affinity scores for all related topics in the database. A "like" increases the score, a "dislike" decreases it.

## 6. Phased Feature Implementation Plan

### Phase 0: Core MVP - The Foundation

*Goal: Deliver a working, non-personalized news reader.*

| Priority | Task | Description |
| :--- | :--- | :--- |
| **P0** | **Backend: Database Setup** | Initialize SQLite and create the initial schema for `Interests` and `Articles`. |
| **P0** | **Backend: Seeding Interests** | Create a function to seed the `Interests` table with a default list of topics on first launch. |
| **P0** | **Backend: Core Graph** | Implement the basic LangGraph workflow: `SettingsAgent` -> `SearchAgent` -> `CurationAgent`. |
| **P0** | **Backend: Core IPC** | Create a `get-daily-news` IPC handler to trigger the core graph and return the curated articles. |
| **P0** | **Frontend: Main UI** | Build the main briefing screen to display a list of `ArticleCard` components. |
| **P0** | **Frontend: Data Fetching** | Implement the `useEffect` hook to call the `get-daily-news` IPC handler and manage loading/error states. |

### Phase 1: Personalization Engine

*Goal: Make the application intelligent and adaptive.*

| Priority | Task | Description |
| :--- | :--- | :--- |
| **P1** | **Backend: Expand Database** | Add `Interactions`, `TopicAffinities`, and `Article_Topics` tables to the schema. |
| **P1** | **Backend: Implement Agents** | Add `TopicExtractorAgent` and `RankingAgent` to the daily workflow. Implement the `AffinityAgent` for the background learning loop. |
| **P1** | **Backend: Interaction IPC** | Create a `log-interaction` IPC handler for the frontend to call on like/dislike. |
| **P1** | **Frontend: UI Feedback** | Add Like/Dislike buttons to the `ArticleCard` component. |
| **P1** | **Frontend: Profile Screen** | Build a new screen where users can see their learned Affinity Scores, fetched via a new IPC handler. |

### Phase 2: Archiving & History

*Goal: Make the application a personal news archive.*

| Priority | Task | Description |
| :--- | :--- | :--- |
| **P2** | **Backend: Expand Database** | Add `Briefings` and `Briefing_Articles` tables to store historical records of daily reports. |
| **P2** | **Backend: Archiving Logic** | At the end of the daily workflow, save the final ranked list of articles as a new briefing entry in the database. |
| **P2** | **Frontend: History Screen** | Build a UI with a calendar/list to allow users to view past briefings. |

## 7. Stretch Goals (Future Vision)

*   **Executive Summary**: Display an AI-generated summary at the top of each daily briefing by implementing the `SummarizerAgent` using the Brave Search API.
*   **Audio Briefing**: Add a "Listen to Briefing" button that uses a Text-to-Speech (TTS) API to generate an audio version of the executive summary.
*   **Deep Dive Agent**: An on-demand research agent triggered from an article, which performs a new, in-depth search on the article's topic to provide more context.
*   **Liked Articles View**: Create a dedicated screen or filter that allows users to view all articles they have liked across all briefings, providing a personal collection of favorite content.

## 8. Success Metrics

*   **Engagement**: Daily Active Users (DAU), number of interactions (clicks, likes, dislikes) per session.
*   **Personalization Quality**: An increasing ratio of likes-to-dislikes over time. High acceptance rate of topic suggestions.
*   **Retention**: High Day 1, Day 7, and Day 30 user retention rates. 