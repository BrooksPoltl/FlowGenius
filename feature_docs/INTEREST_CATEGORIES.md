### Feature: Interest Categories

This feature will allow users to group their interests into customizable categories, generate reports scoped to these categories, and schedule automatic report generation on a per-category basis.

### Backend

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **Create Database Schema** | Create a new migration to add a `categories` table (`id`, `name`) and a many-to-many join table `interests_categories` (`interest_id`, `category_id`). | `src/main/db/migrations/` | - | ☐ |
| **High** | **Update Database Schema for Schedules** | Add a new `category_schedules` table (`id`, `category_id`, `cron_expression`, `is_enabled`, `created_at`, `updated_at`). | `src/main/db/migrations/` | New `categories` table | ☐ |
| **High** | **Implement Category CRUD Services** | Create backend services and IPC handlers for creating, reading, updating, and deleting categories. `categories:create`, `categories:get-all`, `categories:update`, `categories:delete`. Deleting a category should cascade and remove entries from `interests_categories` and `category_schedules`. | `src/main/services/`, `src/main/index.ts` (for IPC) | DB Schema | ☐ |
| **High** | **Implement Interest-Category Association Logic** | Create backend services and IPC handlers for associating interests with categories. `interests:get-assignments`, `interests:set-assignments-for-category`. | `src/main/services/` | DB Schema, Category CRUD | ☐ |
| **Medium** | **Modify Summary Generation Graph** | Update the `news_curator` graph to accept an optional `categoryId`. If a category is provided, the `search` agent should only use interests from that category. If the category is "General" or null, it should use all interests. | `src/main/services/news_curator/graph.ts`, `src/main/services/news_curator/agents/search.ts` | Category Services | ☐ |
| **Medium** | **Implement Default Category Logic** | On startup, check if any categories exist. If not, create a default "General" category. When a new interest is created, it should be assigned to the "General" category by default. | `src/main/index.ts` (startup logic), `src/main/services/user-settings.ts` (or where interests are created) | Category Services | ☐ |
| **Medium** | **Update Scheduler Service for Categories** | Modify the scheduler service to load, manage, and trigger cron jobs based on the `category_schedules` table. Each job will invoke the summary generation graph for its specific category. | `src/main/services/scheduler.ts` | Summary Generation Graph, DB Schema | ☐ |

### Frontend

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | **Category Management UI in Settings** | Create a new component in the settings screen to manage categories. It should display a list of categories and have an input field to create new ones. | `src/renderer/screens/settings.tsx`, `src/renderer/components/` (new component) | - | ☐ |
| **High** | **Implement Category Actions UI** | For each category in the list, add buttons to Rename, Delete (with confirmation), and Manage Interests. | `src/renderer/screens/settings.tsx` (within the new component) | Category Management UI | ☐ |
| **High** | **"Manage Interests" Modal** | Create a modal that opens when "Manage Interests" is clicked. This modal should fetch all interests and display them as a checklist, with currently assigned interests pre-checked. A "Save" button will update the assignments. | `src/renderer/components/ui/` (new modal component) | Category Actions UI, Backend association logic | ☐ |
| **Medium** | **Category Schedule Configuration UI** | Within the settings page for each category, add UI controls to configure its schedule (e.g., a dropdown for frequency - Disabled, Once a day, Twice a day - and time inputs). | `src/renderer/screens/settings.tsx` (within the new component) | Category Management UI, Backend scheduler logic | ☐ |
| **Medium** | **Main Screen Dropdown** | Add a dropdown component to the main/dashboard screen. It should be populated with all available categories plus a "General" option at the top. | `src/renderer/screens/main.tsx` or `dashboard.tsx` | Backend category services | ☐ |
| **Medium** | **Connect "Generate" Button to Category** | Modify the "Generate Summary" button's action to pass the `categoryId` from the new dropdown to the backend summary generation service. | `src/renderer/screens/main.tsx` or `dashboard.tsx` | Main Screen Dropdown | ☐ |
| **Low** | **Frontend State Management** | Integrate category data (list of categories, schedules) into the frontend state management solution to ensure the UI is reactive and data is consistent across components. | `src/renderer/lib/` (state management files) | - | ☐ | 