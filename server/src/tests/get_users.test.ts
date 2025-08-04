
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test users
const testUser1: CreateUserInput = {
  username: 'john_doe',
  email: 'john@example.com',
  role: 'regular',
  department: 'IT'
};

const testUser2: CreateUserInput = {
  username: 'admin_user',
  email: 'admin@example.com',
  role: 'admin',
  department: 'Management'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([testUser1, testUser2])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Find users by username for verification
    const johnUser = result.find(u => u.username === 'john_doe');
    const adminUser = result.find(u => u.username === 'admin_user');

    expect(johnUser).toBeDefined();
    expect(johnUser?.email).toEqual('john@example.com');
    expect(johnUser?.role).toEqual('regular');
    expect(johnUser?.department).toEqual('IT');
    expect(johnUser?.id).toBeDefined();
    expect(johnUser?.created_at).toBeInstanceOf(Date);

    expect(adminUser).toBeDefined();
    expect(adminUser?.email).toEqual('admin@example.com');
    expect(adminUser?.role).toEqual('admin');
    expect(adminUser?.department).toEqual('Management');
    expect(adminUser?.id).toBeDefined();
    expect(adminUser?.created_at).toBeInstanceOf(Date);
  });

  it('should return users with correct field types', async () => {
    await db.insert(usersTable)
      .values(testUser1)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.department).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should return users in consistent order', async () => {
    // Create multiple users
    const users = [
      { ...testUser1, username: 'user_a' },
      { ...testUser1, username: 'user_b', email: 'b@example.com' },
      { ...testUser1, username: 'user_c', email: 'c@example.com' }
    ];

    await db.insert(usersTable)
      .values(users)
      .execute();

    const result1 = await getUsers();
    const result2 = await getUsers();

    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
    
    // Results should be consistent between calls
    expect(result1.map(u => u.username)).toEqual(result2.map(u => u.username));
  });
});
