# FlowGenius 🧠📰

> **AI-Powered Personalized News Curator**  
> *Intelligent news curation that learns from your preferences and delivers increasingly relevant content*

[![Electron](https://img.shields.io/badge/Electron-34.3.0-blue.svg)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://typescriptlang.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.3.5-green.svg)](https://langchain-ai.github.io/langgraph/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-orange.svg)](https://github.com/WiseLibs/better-sqlite3)

---

## 📑 Table of Contents

- [🎯 Product Overview](#-product-overview)
- [✨ Key Features](#-key-features)
- [🚀 Getting Started](#-getting-started)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [📊 Feature Status](#-feature-status)
- [🔮 Future Features](#-future-features)
- [🛠️ Development](#️-development)
- [📚 Documentation](#-documentation)

---

## 🎯 Product Overview

FlowGenius is a desktop application that solves the problem of information overload by providing an intelligent, AI-powered news curation system. Unlike generic news feeds filled with clickbait, FlowGenius learns from your interactions to deliver increasingly relevant and personalized daily news briefings.

### **Core Value Propositions**

- **🧠 Intelligent Learning**: AI system that adapts to your interests through user feedback
- **🎯 Personalized Curation**: News ranked by your learned topic preferences  
- **📚 Complete Archive**: Full history of all news briefings with interaction tracking
- **🔍 Topic Discovery**: AI-powered topic extraction helps you discover new interests
- **📊 Transparency**: View your learned preferences and interaction analytics

### **Problem Statement**

Users are inundated with high-volume information from countless sources, making it difficult and time-consuming to stay informed on topics that matter most to them. Standard news feeds are generic, filled with clickbait, and fail to adapt to nuanced or evolving interests. FlowGenius provides a "smart" news client that actively filters noise and delivers concise, relevant briefings that improve with use.

---

## ✨ Key Features

### **🤖 AI-Powered Curation**
- **Multi-Agent Architecture**: Specialized AI agents for search, curation, topic extraction, and ranking
- **LangGraph Orchestration**: Sophisticated workflow management with error handling
- **Brave Search Integration**: High-quality news sources with real-time data
- **OpenAI Analysis**: Advanced topic extraction and content understanding

### **🎯 Personalization Engine**
- **Topic Affinity Learning**: System learns your preferences through likes, dislikes, and clicks
- **Intelligent Ranking**: Articles reordered based on your learned topic preferences
- **Real-Time Adaptation**: Immediate preference updates with each interaction
- **Analytics Dashboard**: Visual representation of your learned interests and statistics

### **📚 History & Archiving**
- **Automatic Briefing Archive**: Every news run automatically saved with date stamps
- **Collapsible History Sidebar**: Easy navigation through past briefings
- **Interaction State Persistence**: Like/dislike preferences maintained across sessions
- **Smart Date Display**: Relative time formatting ("Today", "Yesterday", "3 days ago")

### **💻 Modern Desktop Experience**
- **Electron Framework**: Native desktop application with web technologies
- **React UI**: Modern, responsive interface with smooth interactions
- **SQLite Database**: Fast, local data storage with no external dependencies
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 📰 Executive Summary (NEW!)
- **Morning Brew Style Briefings**: Get witty, conversational summaries of your curated articles
- **Main Stories**: In-depth summaries of the most important articles with key takeaways
- **Quick Bites**: Snappy one-line summaries of secondary stories
- **Smart Content Scraping**: Respects robots.txt and implements rate limiting
- **Background Processing**: Summaries generate in the background so you see articles immediately

### 🤖 Multi-Agent Architecture
- **Interest Scheduler**: Manages search timing and cool-down periods
- **Search Agent**: Finds relevant articles using Brave Search API
- **Curation Agent**: Filters and processes articles for quality
- **Topic Extractor**: Identifies key themes and topics
- **Ranking Agent**: Scores articles based on your preferences
- **Scraper Agent**: Extracts full article content ethically
- **Summarizer Agent**: Creates engaging executive summaries
- **Database Writer**: Manages atomic data operations

### 💾 Data Management
- **SQLite Database**: Local storage with automatic migrations
- **Briefing History**: Track your reading patterns over time
- **Interest Analytics**: See which topics perform best for you
- **Cleanup Automation**: Automatic cleanup of old briefings to prevent bloat

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js**: Version 18+ (check with `node --version`)
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **Git**: For cloning the repository

### **Environment Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/FlowGenius.git
   cd FlowGenius
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment variables**
   Create a `.env` file in the root directory:
   ```env
   BRAVE_SEARCH_API_KEY=your_brave_search_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

### **API Keys Required**

- **Brave Search API**: Get your free API key at [Brave Search API](https://brave.com/search/api/)
- **OpenAI API**: Get your API key at [OpenAI Platform](https://platform.openai.com/api-keys)

### **First Run Setup**

1. Launch the application
2. Add your interests in the **Interests Modal** (accessible via settings)
3. Click **"Get Daily News"** to run your first curation
4. Start interacting with articles (like/dislike) to train the AI
5. View your learned preferences in the **Analytics** tab

---

## 🏗️ Technical Architecture

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Application Framework** | Electron 34.3.0 | Cross-platform desktop application |
| **Frontend** | React 19.0.0 + TypeScript | Modern UI with type safety |
| **AI Workflow Engine** | LangGraph 0.3.5 | Agent orchestration and state management |
| **Database** | SQLite (better-sqlite3) | Local data persistence |
| **News Data** | Brave Search API | High-quality news sources |
| **AI Processing** | OpenAI GPT-4 | Topic extraction and content analysis |
| **Styling** | TailwindCSS 4.0.9 | Utility-first CSS framework |

### **AI Agent Architecture**

FlowGenius uses a sophisticated multi-agent system orchestrated by LangGraph:

```
🚀 START → 🔧 SettingsAgent → 🔍 SearchAgent → 📝 CurationAgent → 🏷️ TopicExtractorAgent → 📊 RankingAgent → 🎯 END
```

#### **Agent Responsibilities**

1. **🔧 SettingsAgent**: Loads user interests from database
2. **🔍 SearchAgent**: Fetches news from Brave Search API (10 articles per interest)
3. **📝 CurationAgent**: Deduplicates articles and saves new ones to database
4. **🏷️ TopicExtractorAgent**: Uses AI to extract 4 topics per article
5. **📊 RankingAgent**: Reorders articles based on learned topic preferences

### **Database Schema**

The application uses a normalized SQLite database with 9 core tables:

- **Articles**: News article storage with personalization scores
- **Interests**: User-defined topics to follow
- **Topics**: AI-extracted topic categories
- **Article_Topics**: Many-to-many relationship between articles and topics
- **TopicAffinities**: User's learned preferences for each topic
- **Interactions**: User interaction tracking (like/dislike/click)
- **WorkflowRuns**: Execution statistics and performance metrics
- **Briefings**: Historical news briefing archive
- **Briefing_Articles**: Links articles to specific briefings

### **Personalization Algorithm**

The learning system uses a **topic affinity scoring** approach:

```typescript
// Interaction Weights
Like: +0.1 to topic affinity
Dislike: -0.1 to topic affinity  
Click: +0.05 to topic affinity

// Article Scoring
personalización_score = Σ(topic_affinity * relevance_score) / topic_count
```

---

## 📊 Feature Status

### **✅ Completed Features (P0 - P2)**

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| **P0** | Core MVP | ✅ Complete | Basic news fetching and display |
| **P0** | Database Setup | ✅ Complete | SQLite schema with core tables |
| **P0** | LangGraph Workflow | ✅ Complete | Multi-agent news curation pipeline |
| **P0** | Main UI | ✅ Complete | Article cards and news display |
| **P1** | Personalization Engine | ✅ Complete | AI-powered learning from user interactions |
| **P1** | Topic Extraction | ✅ Complete | AI analysis of article content |
| **P1** | Intelligent Ranking | ✅ Complete | Preference-based article ordering |
| **P1** | Like/Dislike System | ✅ Complete | User feedback collection |
| **P1** | Analytics Dashboard | ✅ Complete | Topic affinity visualization |
| **P1** | Interests Management | ✅ Complete | Add/remove topics modal |
| **P2** | History & Archiving | ✅ Complete | Automatic briefing archive |
| **P2** | History Sidebar | ✅ Complete | Collapsible navigation of past briefings |
| **P2** | Interaction Persistence | ✅ Complete | Cross-session state maintenance |

### **🏗️ Current Implementation Details**

- **9 Database Tables**: Complete normalized schema with relationships
- **5 AI Agents**: Specialized agents for each workflow step  
- **8 IPC Handlers**: Full communication between main and renderer processes
- **4 React Screens**: News, Analytics, History, and Settings interfaces
- **Real-time Learning**: Immediate preference updates with user interactions
- **Complete Archive**: Every news run automatically saved with full history

---

## 🔮 Future Features

### **Planned Enhancements (Stretch Goals)**

| Priority | Feature | Description | Estimated Effort |
|----------|---------|-------------|------------------|
| **High** | Executive Summary | AI-generated daily briefing summaries
| **High** | Liked Articles View | Dedicated screen for favorite articles
| **Medium** | Audio Briefing | Text-to-speech integration for audio news
| **Medium** | Deep Dive Agent | On-demand research for article topics
| **Low** | Multi-User Support | Support for multiple user profiles
| **Low** | Export Features | PDF/email export of briefings

### **Technical Improvements**

- **Performance Optimization**: Faster article processing and database queries
- **Enhanced AI Models**: Better topic extraction and content understanding  
- **Advanced Analytics**: More sophisticated user behavior insights
- **Plugin Architecture**: Third-party integration capabilities
- **Cloud Sync**: Optional cloud backup and sync across devices

---

## 🛠️ Development

### **Available Scripts**

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm start            # Start production preview

# Building
pnpm build            # Build for production
pnpm compile:app      # Compile Electron app

# Code Quality
pnpm lint             # Run ESLint checks
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format           # Format code with Prettier

# Release
pnpm make:release     # Create release build
pnpm release          # Publish release
```

### **Project Structure**

```
FlowGenius/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── db/              # Database schema and connection
│   │   ├── services/        # News curator service with AI agents
│   │   └── windows/         # Window management
│   ├── renderer/            # React frontend
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # Main application screens
│   │   └── lib/             # Utilities and helpers
│   ├── preload/             # Electron preload scripts
│   └── shared/              # Shared types and constants
├── feature_docs/            # Product and architecture documentation
└── package.json             # Dependencies and scripts
```

### **Code Style Guidelines**

- **TypeScript**: Strict typing with proper interfaces
- **Functional Programming**: Prefer functions over classes
- **Descriptive Naming**: Clear variable and function names
- **JSDoc Comments**: All functions documented with purpose and parameters
- **Modular Design**: Files under 500 lines for AI tool compatibility
- **Error Handling**: Throw errors instead of fallback values

---

## 📚 Documentation

### **Available Documentation**

- **[Product Requirements Document](feature_docs/PRODUCT_REQUIREMENTS_DOCUMENT.md)**: Complete product vision and requirements
- **[P1 P2 Architecture](feature_docs/P1_P2_ARCHITECTURE.md)**: Detailed technical architecture documentation
- **[Initial Setup Implementation](feature_docs/INITIAL_SETUP_IMPLEMENTATION.md)**: Setup and configuration guide
- **[P0 MVP Implementation](feature_docs/P0_MVP_IMPLEMENTATION.md)**: Core MVP development details
- **[P1 Personalization Engine](feature_docs/P1_PERSONALIZATION_ENGINE.md)**: AI learning system documentation
- **[P2 Archiving and History](feature_docs/P2_ARCHIVING_AND_HISTORY.md)**: History feature implementation

### **API Documentation**

The application exposes several IPC endpoints for communication between main and renderer processes:

- **News Workflow**: `get-daily-news`, `handle-interaction`
- **Settings**: `get-interests`, `add-interest`, `delete-interest`  
- **Analytics**: `get-dashboard-data`, `get-article-interactions`
- **History**: `get-briefings-list`, `get-briefing-articles`

---
## 🙏 Acknowledgments

- **LangGraph**: For the powerful AI agent orchestration framework
- **Brave Search**: For providing high-quality news data API
- **OpenAI**: For advanced language model capabilities
- **Electron**: For enabling cross-platform desktop development
- **React**: For the modern frontend framework

---

**Built with ❤️ for intelligent news consumption**

*FlowGenius - Where AI meets personalized news curation* 