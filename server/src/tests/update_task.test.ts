
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status to true', async () => {
    // Create a task first by inserting directly
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Test task for updating',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    const result = await updateTask(updateInput);

    // Verify the result
    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Test task for updating');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update task completion status to false', async () => {
    // Create a completed task first by inserting directly
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Completed task',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update the task to incomplete
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: false
    };
    const result = await updateTask(updateInput);

    // Verify the result
    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toEqual('Completed task');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated task to database', async () => {
    // Create a task first by inserting directly
    const insertResult = await db.insert(tasksTable)
      .values({
        description: 'Task to verify database update',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    await updateTask(updateInput);

    // Query the database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toEqual(createdTask.id);
    expect(tasks[0].description).toEqual('Task to verify database update');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      completed: true
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });
});
