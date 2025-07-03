/**
 * Categories Service - Manages categories and interest-category associations
 * Handles CRUD operations for categories and many-to-many relationships with interests
 */

import db from '../db';
import { Category, CategorySchedule } from '../db/schema';

/**
 * Gets all categories from the database
 * @returns Array of categories
 */
export function getAllCategories(): Category[] {
  try {
    const stmt = db.prepare('SELECT * FROM Categories ORDER BY name');
    return stmt.all() as Category[];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

/**
 * Creates a new category
 * @param name - Category name
 * @returns Category ID if successful, null if failed
 */
export function createCategory(name: string): number | null {
  try {
    const stmt = db.prepare(
      "INSERT INTO Categories (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))"
    );
    const result = stmt.run(name);
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

/**
 * Updates a category name
 * @param categoryId - Category ID
 * @param name - New category name
 * @returns boolean indicating success
 */
export function updateCategory(categoryId: number, name: string): boolean {
  try {
    const stmt = db.prepare(
      "UPDATE Categories SET name = ?, updated_at = datetime('now') WHERE id = ?"
    );
    const result = stmt.run(name, categoryId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
}

/**
 * Deletes a category and all its associations
 * @param categoryId - Category ID
 * @returns boolean indicating success
 */
export function deleteCategory(categoryId: number): boolean {
  try {
    // Start transaction to ensure consistency
    const transaction = db.transaction(() => {
      // Delete category schedules
      db.prepare('DELETE FROM Category_Schedules WHERE category_id = ?').run(
        categoryId
      );

      // Delete interest-category associations
      db.prepare('DELETE FROM Interests_Categories WHERE category_id = ?').run(
        categoryId
      );

      // Delete the category itself
      const result = db
        .prepare('DELETE FROM Categories WHERE id = ?')
        .run(categoryId);

      return result.changes > 0;
    });

    return transaction();
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}

/**
 * Gets all interests assigned to a specific category
 * @param categoryId - Category ID
 * @returns Array of interest names
 */
export function getInterestsForCategory(categoryId: number): string[] {
  try {
    const stmt = db.prepare(`
      SELECT i.name 
      FROM Interests i
      JOIN Interests_Categories ic ON i.id = ic.interest_id
      WHERE ic.category_id = ?
      ORDER BY i.name
    `);
    const rows = stmt.all(categoryId) as Array<{ name: string }>;
    return rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting interests for category:', error);
    return [];
  }
}

/**
 * Gets all categories for a specific interest
 * @param interestName - Interest name
 * @returns Array of categories
 */
export function getCategoriesForInterest(interestName: string): Category[] {
  try {
    const stmt = db.prepare(`
      SELECT c.* 
      FROM Categories c
      JOIN Interests_Categories ic ON c.id = ic.category_id
      JOIN Interests i ON i.id = ic.interest_id
      WHERE i.name = ?
      ORDER BY c.name
    `);
    return stmt.all(interestName) as Category[];
  } catch (error) {
    console.error('Error getting categories for interest:', error);
    return [];
  }
}

/**
 * Sets the category assignments for a specific category
 * Replaces all existing assignments with the new list
 * @param categoryId - Category ID
 * @param interestNames - Array of interest names to assign
 * @returns boolean indicating success
 */
export function setInterestsForCategory(
  categoryId: number,
  interestNames: string[]
): boolean {
  try {
    const transaction = db.transaction(() => {
      // Remove existing assignments for this category
      db.prepare('DELETE FROM Interests_Categories WHERE category_id = ?').run(
        categoryId
      );

      // Add new assignments
      const insertStmt = db.prepare(`
        INSERT INTO Interests_Categories (interest_id, category_id, created_at)
        SELECT i.id, ?, datetime('now')
        FROM Interests i
        WHERE i.name = ?
      `);

      for (const interestName of interestNames) {
        insertStmt.run(categoryId, interestName);
      }
    });

    transaction();
    return true;
  } catch (error) {
    console.error('Error setting interests for category:', error);
    return false;
  }
}

/**
 * Gets interests filtered by category (for search agent)
 * @param categoryId - Category ID, if null returns all interests
 * @returns Array of interest names
 */
export function getInterestsByCategory(categoryId: number | null): string[] {
  try {
    if (categoryId === null) {
      // Return all interests for "General" view
      const stmt = db.prepare('SELECT name FROM Interests ORDER BY name');
      const rows = stmt.all() as Array<{ name: string }>;
      return rows.map(row => row.name);
    }

    // Return interests for specific category
    return getInterestsForCategory(categoryId);
  } catch (error) {
    console.error('Error getting interests by category:', error);
    return [];
  }
}

/**
 * Gets category schedule settings
 * @param categoryId - Category ID
 * @returns CategorySchedule or null if not found
 */
export function getCategorySchedule(
  categoryId: number
): CategorySchedule | null {
  try {
    const stmt = db.prepare(
      'SELECT * FROM Category_Schedules WHERE category_id = ?'
    );
    return stmt.get(categoryId) as CategorySchedule | null;
  } catch (error) {
    console.error('Error getting category schedule:', error);
    return null;
  }
}

/**
 * Sets category schedule settings
 * @param categoryId - Category ID
 * @param cronExpression - Cron expression for scheduling
 * @param isEnabled - Whether scheduling is enabled
 * @returns boolean indicating success
 */
export function setCategorySchedule(
  categoryId: number,
  cronExpression: string,
  isEnabled: boolean
): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Category_Schedules 
      (category_id, cron_expression, is_enabled, created_at, updated_at)
      VALUES (?, ?, ?, 
        COALESCE((SELECT created_at FROM Category_Schedules WHERE category_id = ?), datetime('now')),
        datetime('now')
      )
    `);
    const result = stmt.run(
      categoryId,
      cronExpression,
      isEnabled ? 1 : 0,
      categoryId
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error setting category schedule:', error);
    return false;
  }
}

/**
 * Gets all enabled category schedules
 * @returns Array of category schedules with category names
 */
export function getEnabledCategorySchedules(): Array<
  CategorySchedule & { categoryName: string }
> {
  try {
    const stmt = db.prepare(`
      SELECT cs.*, c.name as categoryName
      FROM Category_Schedules cs
      JOIN Categories c ON cs.category_id = c.id
      WHERE cs.is_enabled = true
      ORDER BY c.name
    `);
    return stmt.all() as Array<CategorySchedule & { categoryName: string }>;
  } catch (error) {
    console.error('Error getting enabled category schedules:', error);
    return [];
  }
}

/**
 * Ensures default "General" category exists and assigns unassigned interests to it
 */
export function ensureDefaultCategory(): void {
  try {
    const transaction = db.transaction(() => {
      // Check if General category exists
      let generalCategory = db
        .prepare('SELECT id FROM Categories WHERE name = ?')
        .get('General') as { id: number } | undefined;

      if (!generalCategory) {
        // Create General category
        const result = db
          .prepare(
            "INSERT INTO Categories (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))"
          )
          .run('General');
        generalCategory = { id: result.lastInsertRowid as number };
      }

      // Assign any unassigned interests to General category
      db.prepare(
        `
        INSERT OR IGNORE INTO Interests_Categories (interest_id, category_id, created_at)
        SELECT i.id, ?, datetime('now')
        FROM Interests i
        WHERE i.id NOT IN (SELECT DISTINCT interest_id FROM Interests_Categories)
      `
      ).run(generalCategory.id);
    });

    transaction();
  } catch (error) {
    console.error('Error ensuring default category:', error);
  }
}
