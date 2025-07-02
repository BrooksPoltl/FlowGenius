### New Feature: Smart Interest Cool-down

**Goal:** Prevent the system from searching for topics that have recently provided new articles, based on their unique, learned discovery frequency.

---

### **Phase 1: Backend Infrastructure**

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **Update Database Schema** | Add new columns to the `Interests` table to track discovery metrics: `last_new_article_at` (TIMESTAMP), `discovery_count` (INTEGER), and `avg_discovery_interval_seconds` (REAL). | `src/main/db/schema.ts` | None | `[ ]` |
| **High** | **Create DB Migration** | Create a new database migration script to safely apply the schema changes to existing user databases without data loss. | `src/main/db/migrations/` (New Folder/File) | Backend Task 1 | `[ ]` |
| **High** | **Update `initializeSettings`** | Modify the database initialization function to run the new migration script, ensuring all users get the updated table structure. | `src/main/services/settings.ts` | Backend Task 2 | `[ ]` |

---

### **Phase 2: Agent & Workflow Implementation**

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **Create `InterestSchedulerAgent`** | Create a new agent that filters interests based on the cool-down logic: `(NOW - last_new_article_at) < (avg_discovery_interval_seconds * 3)`. Interests that are "on cool-down" will be skipped for the current run. | `src/main/services/news_curator/agents/scheduler.ts` (New File) | Phase 1 | `[ ]` |
| **High** | **Update `SearchAgent`** | Modify the `SearchAgent` to tag each article it finds with the parent `interest` that was used to search for it. This is crucial for tracking which interests yield new content. | `src/main/services/news_curator/agents/search.ts` | None | `[ ]` |
| **High** | **Update `CurationAgent`** | After saving a new article, update this agent to: 1. Identify the source interest (from the tag added in the previous step). 2. Calculate the time since the last discovery. 3. Update the `avg_discovery_interval_seconds` and other metrics in the `Interests` table for that specific interest. | `src/main/services/news_curator/agents/curation.ts` | Phase 2, Task 2 | `[ ]` |
| **High** | **Update LangGraph Workflow** | Integrate the new `InterestSchedulerAgent` into the workflow. The new agent sequence will be: `SettingsAgent` -> `InterestSchedulerAgent` -> `SearchAgent`. | `src/main/services/news_curator/graph.ts` | Phase 2, Task 1 | `[ ]` |

</rewritten_file> 