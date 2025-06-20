
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  description: 'Test task description'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.description).toEqual('Test task description');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Test task description');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different task descriptions', async () => {
    const inputs = [
      { description: 'Buy groceries' },
      { description: 'Complete project documentation' },
      { description: 'Schedule team meeting' }
    ];

    for (const input of inputs) {
      const result = await createTask(input);
      expect(result.description).toEqual(input.description);
      expect(result.completed).toEqual(false);
      expect(result.id).toBeDefined();
    }

    // Verify all tasks were created
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(3);
  });
});
