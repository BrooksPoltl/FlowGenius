### Feature: Topic Recommendations

This feature will suggest new topics for users to add to their interests based on their positive interactions (likes) with articles.

---

### Backend Implementation

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | Create Recommendation Service | Create a new file to house the recommendation logic. It will export a `getTopicRecommendations` function. | `src/main/services/recommendations.ts` (New File) | None | `[x]` |
| **High** | Implement Recommendation Logic | The `getTopicRecommendations` function will query `TopicAffinities` for topics with `affinity_score > 0.5` and `interaction_count >= 3`, filter out topics already in the user's `Interests`, sort by score, and return the top 5. | `src/main/services/recommendations.ts` | Backend Task 1 | `[x]` |
| **High** | Expose Service via IPC | Register an `ipcMain.handle('get-topic-recommendations', ...)` in the main process to make the recommendation service available to the frontend. | `src/main/index.ts` | Backend Task 2 | `[x]` |
| **Medium** | Update Preload & Types | Add the new `get-topic-recommendations` channel to the `contextBridge` API definition in the preload script to ensure type-safe communication. | `src/preload/index.ts`, `index.d.ts` | Backend Task 3 | `[x]` |

---

### Frontend Implementation

| Priority | Task Description | Implementation Details | Code Pointers | Dependencies | Completion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** | Create `RecommendedTopics` Component | Build a new React component to fetch and display the list of recommended topics with an "Add" button for each. It will handle its own loading and empty states. | `src/renderer/components/RecommendedTopics.tsx` (New File) | Backend IPC | `[x]` |
| **High** | Implement "Add" Functionality | The "Add" button will call the existing `add-interest` IPC handler. On success, it will refresh the recommendations list to remove the newly added topic. | `src/renderer/components/RecommendedTopics.tsx` | Frontend Task 1 | `[x]` |
| **Medium** | Integrate Component into UI | Add the `RecommendedTopics` component into the `InterestsModal` under a new "Suggestions for You" section, providing a contextually relevant place for users to discover new topics. | `src/renderer/components/InterestsModal.tsx` | Frontend Task 1 | `[x]` | 