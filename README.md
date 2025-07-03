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

FlowGenius (PulseNews) is a desktop application that solves the problem of information overload by providing an intelligent, AI-powered news curation system. Unlike generic news feeds filled with clickbait, FlowGenius learns from your interactions to deliver increasingly relevant and personalized daily news briefings with real-time progress tracking and desktop notifications.

### **Core Value Propositions**

- **🧠 Intelligent Learning**: AI system that adapts to your interests through user feedback
- **🎯 Personalized Curation**: News ranked by your learned topic preferences  
- **📰 Executive Summaries**: Morning Brew style briefings with witty, conversational tone
- **🔔 Smart Notifications**: Desktop notifications when briefings are ready
- **📊 Real-time Progress**: Live workflow progress tracking with 10-step pipeline visualization
- **🖥️ System Tray Integration**: Runs in background with convenient system tray access
- **📚 Complete Archive**: Full history of all news briefings with interaction tracking
- **🔍 Topic Discovery**: AI-powered topic extraction helps you discover new interests
- **📊 Transparency**: View your learned preferences and interaction analytics

### **Problem Statement**

Users are inundated with high-volume information from countless sources, making it difficult and time-consuming to stay informed on topics that matter most to them. Standard news feeds are generic, filled with clickbait, and fail to adapt to nuanced or evolving interests. FlowGenius provides a "smart" news client that actively filters noise and delivers concise, relevant briefings that improve with use.

---

## ✨ Key Features

### **🤖 AI-Powered Curation**
- **Unified Multi-Agent Architecture**: 10-step workflow with specialized AI agents
- **LangGraph Orchestration**: Sophisticated workflow management with streaming progress updates
- **Real-time Progress Tracking**: Live updates showing current workflow step with descriptive messages
- **Brave Search Integration**: High-quality news sources with real-time data
- **OpenAI Analysis**: Advanced topic extraction and content understanding

### **📰 Executive Summary System**
- **Morning Brew Style Briefings**: Witty, conversational summaries with personality
- **Main Stories**: In-depth analysis of top articles with key takeaways
- **Quick Bites**: Snappy one-line summaries of secondary stories
- **Smart Content Scraping**: Ethical scraping with robots.txt compliance and rate limiting
- **Automatic Generation**: Summaries created as part of unified workflow
- **Rich Citations**: Linked sources with thumbnails and publication details

### **🔔 Desktop Notifications & System Integration**
- **Native Desktop Notifications**: Custom-branded notifications with app icon
- **macOS Permission Handling**: Proper permission request flow for notifications
- **System Tray Integration**: Runs in background with convenient tray access
- **Custom App Icons**: Branded tray icon and dock/taskbar icons
- **Auto-focus on Notification Click**: Brings app to foreground when clicked
- **Notification Testing**: Built-in test functionality for troubleshooting

### **⚡ Real-time Workflow Progress**
- **10-Step Progress Tracking**: Visual progress through entire curation pipeline
- **Live Status Updates**: Real-time step names and descriptive messages
- **Progress Modal**: Beautiful progress indicator with percentage completion
- **Auto-close on Completion**: Seamless transition to viewing results
- **Error Handling**: Clear error states and recovery options

### **🎯 Personalization Engine**
- **Topic Affinity Learning**: System learns your preferences through likes, dislikes, and clicks
- **Intelligent Ranking**: Articles reordered based on your learned topic preferences
- **Real-Time Adaptation**: Immediate preference updates with each interaction
- **Analytics Dashboard**: Visual representation of your learned interests and statistics
- **Category Management**: Organize interests into custom categories with scheduling

### **📚 History & Archiving**
- **Automatic Briefing Archive**: Every news run automatically saved with summaries
- **Collapsible History Sidebar**: Easy navigation through past briefings with auto-selection
- **Interaction State Persistence**: Like/dislike preferences maintained across sessions
- **Smart Date Display**: Relative time formatting ("Today", "Yesterday", "3 days ago")
- **Auto-refresh on New Briefings**: Seamless updates when new content is ready

### **💻 Modern Desktop Experience**
- **Electron Framework**: Native desktop application with web technologies
- **React UI**: Modern, responsive interface with smooth interactions
- **SQLite Database**: Fast, local data storage with automatic migrations
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **System Tray Background Operation**: Continues running when window is closed
- **Minimize to Tray**: Unobtrusive background operation

### **🔧 Enhanced Workflow Architecture**

The unified workflow includes these 10 specialized agents:

1. **⚙️ Settings Agent**: Loads user interests and preferences
2. **📅 Scheduler Agent**: Manages interest cooldowns and timing
3. **🔍 Search Agent**: Finds relevant articles using Brave Search API
4. **📝 Curation Agent**: Filters and processes articles for quality
5. **🏷️ Clustering Agent**: Groups related articles together
6. **🎯 Topic Extractor**: Identifies key themes and topics using AI
7. **📊 Ranking Agent**: Scores articles based on learned preferences
8. **🌐 Scraper Agent**: Extracts full article content ethically
9. **📰 Summarizer Agent**: Creates engaging executive summaries
10. **💾 Database Writer**: Saves all data atomically with summaries

### **💾 Enhanced Data Management**
- **SQLite Database**: Local storage with automatic migrations
- **Briefing History**: Track your reading patterns over time with summaries
- **Interest Analytics**: See which topics perform best for you
- **User Settings**: Notification preferences, scheduling, and app behavior
- **Category Organization**: Custom category creation with interest assignment
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
2. **Grant notification permissions** (macOS will prompt automatically)
3. Add your interests in the **Settings** screen
4. Create **custom categories** to organize your interests
5. Click **"Curate News"** to run your first workflow with progress tracking
6. Watch the **real-time progress** through the 10-step pipeline
7. Receive a **desktop notification** when your briefing is ready
8. Start interacting with articles (like/dislike) to train the AI
9. View your **executive summary** with Morning Brew style content
10. Check your learned preferences in the **Analytics** tab

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
| **System Integration** | Electron System Tray | Background operation and notifications |

### **Unified Workflow Architecture**

FlowGenius uses a sophisticated 10-agent system orchestrated by LangGraph with streaming progress updates:

```
🚀 START → ⚙️ Settings → 📅 Scheduler → 🔍 Search → 📝 Curation → 🏷️ Clustering → 
🎯 Topics → 📊 Ranking → 🌐 Scraper → 📰 Summarizer → 💾 Database → 🔔 Notification → 🎯 END
```

#### **Real-time Progress Flow**

Each agent reports progress in real-time:
- **Starting State**: "Loading Settings", "Searching Articles", etc.
- **Progress Updates**: Live percentage completion (1/10, 2/10, etc.)
- **Completion State**: Success confirmation with next step preview
- **Error Handling**: Clear error states with recovery options

#### **Agent Responsibilities**

1. **⚙️ Settings Agent**: Loads user interests and category filters
2. **📅 Scheduler Agent**: Manages cooldown periods and timing logic
3. **🔍 Search Agent**: Fetches news from Brave Search API (10 articles per interest)
4. **📝 Curation Agent**: Deduplicates articles and saves new ones to database
5. **🏷️ Clustering Agent**: Groups related articles using similarity algorithms
6. **🎯 Topic Extractor**: Uses AI to extract key themes and topics
7. **📊 Ranking Agent**: Scores articles based on learned user preferences
8. **🌐 Scraper Agent**: Extracts full article content with ethical rate limiting
9. **📰 Summarizer Agent**: Creates Morning Brew style executive summaries
10. **💾 Database Writer**: Saves briefing and summary data atomically

### **Database Schema**

The application uses a normalized SQLite database with enhanced tables:

- **Articles**: News article storage with clustering and scoring data
- **Interests**: User-defined topics with category assignments
- **Categories**: Custom interest organization with scheduling
- **Topics**: AI-extracted topic categories
- **Article_Topics**: Many-to-many relationship between articles and topics
- **TopicAffinities**: User's learned preferences for each topic
- **Interactions**: User interaction tracking (like/dislike/click)
- **Briefings**: Historical news briefing archive with summaries
- **Briefing_Articles**: Links articles to specific briefings
- **UserSettings**: App preferences including notifications and scheduling

### **Notification System Architecture**

- **macOS Permission Handling**: Proper system permission request flow
- **Custom Icon Integration**: Branded notifications with app icon
- **IPC Communication**: Secure communication between main and renderer processes
- **Error Handling**: Graceful fallback when permissions are denied
- **Testing Infrastructure**: Built-in notification testing capabilities

### **Personalization Algorithm**

The learning system uses enhanced **topic affinity scoring**:

```typescript
// Interaction Weights
Like: +0.1 to topic affinity
Dislike: -0.1 to topic affinity  
Click: +0.05 to topic affinity

// Article Scoring (Enhanced)
personalization_score = Σ(topic_affinity * relevance_score) / topic_count
clustering_score = similarity_to_cluster_centroid
final_score = (personalization_score * 0.7) + (clustering_score * 0.3)
```

---

## 📊 Feature Status

### **✅ Completed Features (P0 - P3)**

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| **P0** | Core MVP | ✅ Complete | Basic news fetching and display |
| **P0** | Database Setup | ✅ Complete | SQLite schema with migrations |
| **P0** | LangGraph Workflow | ✅ Complete | Multi-agent news curation pipeline |
| **P0** | Main UI | ✅ Complete | Article cards and news display |
| **P1** | Personalization Engine | ✅ Complete | AI-powered learning from user interactions |
| **P1** | Topic Extraction | ✅ Complete | AI analysis of article content |
| **P1** | Intelligent Ranking | ✅ Complete | Preference-based article ordering |
| **P1** | Like/Dislike System | ✅ Complete | User feedback collection |
| **P1** | Analytics Dashboard | ✅ Complete | Topic affinity visualization |
| **P1** | Interests Management | ✅ Complete | Add/remove topics interface |
| **P2** | History & Archiving | ✅ Complete | Automatic briefing archive |
| **P2** | History Sidebar | ✅ Complete | Navigation with auto-selection |
| **P2** | Interaction Persistence | ✅ Complete | Cross-session state maintenance |
| **P3** | Executive Summaries | ✅ Complete | Morning Brew style briefings |
| **P3** | Content Scraping | ✅ Complete | Ethical full-text article extraction |
| **P3** | Unified Workflow | ✅ Complete | 10-agent pipeline with progress tracking |
| **P3** | Real-time Progress | ✅ Complete | Live workflow progress visualization |
| **P3** | Desktop Notifications | ✅ Complete | Native notifications with custom icons |
| **P3** | System Tray Integration | ✅ Complete | Background operation with tray access |
| **P3** | Category Management | ✅ Complete | Custom interest organization |
| **P3** | User Settings | ✅ Complete | Notification and scheduling preferences |

### **🏗️ Current Implementation Details**

- **12+ Database Tables**: Complete normalized schema with relationships
- **10 AI Agents**: Specialized agents in unified workflow pipeline  
- **15+ IPC Handlers**: Comprehensive communication layer
- **5 React Screens**: News, Summary, Analytics, History, and Settings interfaces
- **Real-time Learning**: Immediate preference updates with user interactions
- **Complete Archive**: Every news run saved with executive summaries
- **System Integration**: Tray icon, notifications, and background operation
- **Progress Tracking**: Live workflow visualization with 10 steps
- **Custom Branding**: App icons for tray, dock, and notifications

---

## 🔮 Future Features

### **Planned Enhancements (Stretch Goals)**

| Priority | Feature | Description | Estimated Effort |
|----------|---------|-------------|------------------|
| **High** | Audio Briefing | Text-to-speech integration for audio news summaries
| **High** | Liked Articles View | Dedicated screen for favorite articles collection
| **Medium** | Deep Dive Agent | On-demand research for article topics with expanded analysis
| **Medium** | Export Features | PDF/email export of briefings and summaries
| **Medium** | Scheduling Automation | Category-specific automated briefing schedules
| **Low** | Multi-User Support | Support for multiple user profiles
| **Low** | Cloud Sync | Optional cloud backup and sync across devices
| **Low** | Plugin Architecture | Third-party integration capabilities

### **Technical Improvements**

- **Performance Optimization**: Faster article processing and database queries
- **Enhanced AI Models**: Better topic extraction and content understanding  
- **Advanced Analytics**: More sophisticated user behavior insights
- **Mobile Companion**: Mobile app for briefing consumption
- **API Endpoints**: REST API for third-party integrations

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
│   ├── main/                    # Electron main process
│   │   ├── db/                 # Database schema and migrations
│   │   ├── services/           # News curator service with AI agents
│   │   │   ├── news_curator/   # 10-agent workflow system
│   │   │   ├── categories.ts   # Category management
│   │   │   ├── settings.ts     # User preferences
│   │   │   └── scheduler.ts    # Automated scheduling
│   │   └── windows/            # Window and tray management
│   ├── renderer/               # React frontend
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Enhanced UI components
│   │   │   ├── WorkflowProgress.tsx  # Real-time progress modal
│   │   │   ├── SummaryView.tsx       # Executive summary display
│   │   │   └── HistorySidebar.tsx    # Briefing history navigation
│   │   ├── screens/            # Main application screens
│   │   └── lib/                # Utilities and helpers
│   ├── preload/                # Electron preload scripts with IPC
│   ├── shared/                 # Shared types and constants
│   └── resources/              # App icons and static assets
├── feature_docs/               # Product and architecture documentation
└── package.json                # Dependencies and scripts
```

### **Code Style Guidelines**

- **TypeScript**: Strict typing with proper interfaces
- **Functional Programming**: Prefer functions over classes
- **Descriptive Naming**: Clear variable and function names with auxiliary verbs
- **JSDoc Comments**: All functions documented with purpose and parameters
- **Modular Design**: Files under 500 lines for AI tool compatibility
- **Error Handling**: Throw errors instead of fallback values
- **Real-time Updates**: IPC streaming for live progress updates

---

## 📚 Documentation

### **Available Documentation**

- **[Product Requirements Document](feature_docs/PRODUCT_REQUIREMENTS_DOCUMENT.md)**: Complete product vision and requirements
- **[Unified Article Pipeline](feature_docs/UNIFIED_ARTICLE_PIPELINE.md)**: 10-agent workflow architecture
- **[P1 P2 Architecture](feature_docs/P1_P2_ARCHITECTURE.md)**: Detailed technical architecture documentation
- **[Initial Setup Implementation](feature_docs/INITIAL_SETUP_IMPLEMENTATION.md)**: Setup and configuration guide
- **[P0 MVP Implementation](feature_docs/P0_MVP_IMPLEMENTATION.md)**: Core MVP development details
- **[P1 Personalization Engine](feature_docs/P1_PERSONALIZATION_ENGINE.md)**: AI learning system documentation
- **[P2 Archiving and History](feature_docs/P2_ARCHIVING_AND_HISTORY.md)**: History feature implementation
- **[P5 Executive Summary](feature_docs/P5_EXECUTIVE_SUMMARY.md)**: Morning Brew style summary system

### **API Documentation**

The application exposes comprehensive IPC endpoints:

- **News Workflow**: `curate-news`, `force-refresh`, `handle-interaction`
- **Settings**: `get-interests`, `add-interest`, `delete-interest`, `get-settings`, `update-settings`  
- **Categories**: `categories:get-all`, `categories:create`, `categories:update`, `categories:delete`
- **Analytics**: `get-dashboard-data`, `get-article-interactions`
- **History**: `get-briefings-list`, `get-briefing-articles`, `get-summary`
- **Notifications**: `send-test-notification`, `request-notification-permission`
- **Progress**: `workflow-progress` (streaming), `trigger-test-progress`

---

## 🙏 Acknowledgments

- **LangGraph**: For the powerful AI agent orchestration framework
- **Brave Search**: For providing high-quality news data API
- **OpenAI**: For advanced language model capabilities
- **Electron**: For enabling cross-platform desktop development
- **React**: For the modern frontend framework
- **SQLite**: For reliable local data storage

---

**Built with ❤️ for intelligent news consumption**

*FlowGenius - Where AI meets personalized news curation with real-time progress and smart notifications* 