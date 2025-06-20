
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const createResult = await db.insert(tasksTable)
      .values({
        description: 'Task to delete',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify task is removed from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
    // Try to delete a non-existent task
    const deleteInput: DeleteTaskInput = { id: 999 };
    const result = await deleteTask(deleteInput);

    // Should return success false since no task was found
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple test tasks
    const createResults = await db.insert(tasksTable)
      .values([
        { description: 'Task 1', completed: false },
        { description: 'Task 2', completed: true },
        { description: 'Task 3', completed: false }
      ])
      .returning()
      .execute();

    const taskToDeleteId = createResults[1].id;

    // Delete the middle task
    const deleteInput: DeleteTaskInput = { id: taskToDeleteId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the target task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.some(task => task.id === taskToDeleteId)).toBe(false);
    expect(remainingTasks.some(task => task.description === 'Task 1')).toBe(true);
    expect(remainingTasks.some(task => task.description === 'Task 3')).toBe(true);
  });
});
