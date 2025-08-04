
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test user creation helper
const createTestUser = async (): Promise<number> => {
  const testUser: CreateUserInput = {
    username: 'testuser',
    email: 'test@example.com',
    role: 'regular',
    department: 'IT'
  };

  const result = await db.insert(usersTable)
    .values(testUser)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user username', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('regular'); // Should remain unchanged
    expect(result.department).toEqual('IT'); // Should remain unchanged
  });

  it('should update user email', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('newemail@example.com');
    expect(result.role).toEqual('regular'); // Should remain unchanged
    expect(result.department).toEqual('IT'); // Should remain unchanged
  });

  it('should update user role', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('admin');
    expect(result.department).toEqual('IT'); // Should remain unchanged
  });

  it('should update user department', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      department: 'HR'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('regular'); // Should remain unchanged
    expect(result.department).toEqual('HR');
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'newusername',
      email: 'newuser@example.com',
      role: 'admin',
      department: 'Management'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('newusername');
    expect(result.email).toEqual('newuser@example.com');
    expect(result.role).toEqual('admin');
    expect(result.department).toEqual('Management');
  });

  it('should persist changes to database', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'persisteduser',
      email: 'persisted@example.com'
    };

    await updateUser(updateInput);

    // Verify changes were persisted in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('persisteduser');
    expect(users[0].email).toEqual('persisted@example.com');
    expect(users[0].role).toEqual('regular'); // Should remain unchanged
    expect(users[0].department).toEqual('IT'); // Should remain unchanged
  });

  it('should return existing user when no fields to update', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('regular');
    expect(result.department).toEqual('IT');
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 999999,
      username: 'nonexistent'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/User with id 999999 not found/i);
  });

  it('should handle created_at field correctly', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'timetest'
    };

    const result = await updateUser(updateInput);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeDefined();
  });
});
