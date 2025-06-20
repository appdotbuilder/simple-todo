
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test task inputs
const testTask1: CreateTaskInput = {
  description: 'First task'
};

const testTask2: CreateTaskInput = {
  description: 'Second task'
};

const testTask3: CreateTaskInput = {
  description: 'Third task'
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { description: testTask1.description },
        { description: testTask2.description },
        { description: testTask3.description }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].description).toBeDefined();
    expect(result[0].completed).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with small delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ description: 'First created' })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ description: 'Second created' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ description: 'Third created' })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    // Should be ordered by created_at desc (newest first)
    expect(result[0].description).toEqual('Third created');
    expect(result[1].description).toEqual('Second created');
    expect(result[2].description).toEqual('First created');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return tasks with correct data types', async () => {
    await db.insert(tasksTable)
      .values({
        description: 'Test task',
        completed: true
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    expect(typeof task.id).toBe('number');
    expect(typeof task.description).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.description).toEqual('Test task');
    expect(task.completed).toBe(true);
  });
});
