### Feature: Automatic Briefings and Notifications

**Objective:** To automatically generate news briefings at user-defined schedules and notify the user when a new briefing is ready, driving re-engagement with the application.

---

### Backend Implementation

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Database Schema for Settings** | Create a new migration for a `user_settings` table to store schedule and notification preferences. | - `src/main/db/migrations/` (new file) <br> - `src/main/db/schema.ts` | - | Not Started |
| **P0** | **Settings Service** | Create a service to manage getting and setting user preferences from the `user_settings` table. | - `src/main/services/user-settings.ts` (new file) | DB Schema | Not Started |
| **P0** | **IPC for Settings** | Expose the Settings Service to the renderer process via IPC channels (`settings:get`, `settings:update`). | - `src/main/index.ts` <br> - `src/preload/index.ts` <br> - `index.d.ts` | Settings Service | Not Started |
| **P1** | **Scheduling Service** | Implement a scheduler using `node-cron` in the main process. It will read user settings and invoke the LangGraph workflow at the configured times. | - `src/main/services/scheduler.ts` (new file) | Settings Service, News Curation Graph | Not Started |
| **P1** | **Background Execution** | Implement system tray functionality. When the main window is closed, the application continues running in the background. | - `src/main/index.ts` or `src/lib/electron-app/factories/app/setup.ts` | - | Not Started |
| **P1** | **`notification_agent`** | Create a new `notification_agent` node for the LangGraph. This agent will use Electron's `Notification` API to display a desktop notification. | - `src/main/services/news_curator/agents/notification.ts` (new file) | - | Not Started |
| **P1** | **Integrate Notification Agent** | Update the graph definition to include the new agent. After the `database_writer` node completes, the graph will transition to the `notification_agent`. | - `src/main/services/news_curator/graph.ts` | `notification_agent` | Not Started |
| **P2** | **Handle Notification Clicks** | Add logic to the `notification_agent` so that clicking the notification focuses and shows the application window. | - `src/main/services/news_curator/agents/notification.ts` | - | Not Started |

### Frontend Implementation

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Create Settings Page** | Develop a new "Settings" screen in the React application. Add a route for it and a link in the main navigation (e.g., in the sidebar). | - `src/renderer/screens/settings.tsx` (new file) <br> - `src/renderer/routes.tsx` <br> - `src/renderer/components/HistorySidebar.tsx` | - | Not Started |
| **P1** | **Scheduling UI** | On the Settings page, create UI components (e.g., toggles, time pickers) for users to enable/disable morning/evening briefings and configure their desired times. These will interact with the backend via the Settings IPC channels. | - `src/renderer/screens/settings.tsx` | IPC for Settings | Not Started |
| **P1** | **Notification Preferences UI** | Add a simple toggle on the Settings page to allow users to globally enable or disable all notifications from the application. | - `src/renderer/screens/settings.tsx` | IPC for Settings | Not Started |
| **P2** | **Move Interest Management** | Relocate the existing "Manage Interests" functionality from its current modal into a dedicated section on the new Settings page for a consolidated user experience. | - `src/renderer/screens/settings.tsx` <br> - `src/renderer/components/InterestsModal.tsx` | Settings Page | Not Started | 