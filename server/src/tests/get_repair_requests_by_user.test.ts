
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable, repairRequestsTable } from '../db/schema';
import { type GetRepairRequestsByUserInput } from '../schema';
import { getRepairRequestsByUser } from '../handlers/get_repair_requests_by_user';

describe('getRepairRequestsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return repair requests for specific user', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      role: 'regular',
      department: 'IT'
    }).returning().execute();

    const asset = await db.insert(assetsTable).values({
      name: 'Test Asset',
      type: 'it_device',
      department: 'IT',
      location: 'Office A',
      serial_number: 'TEST001',
      purchase_date: new Date(),
      status: 'active',
      assigned_user_id: null
    }).returning().execute();

    // Create repair requests for the user
    await db.insert(repairRequestsTable).values([
      {
        asset_id: asset[0].id,
        requested_by_user_id: user[0].id,
        description: 'Screen not working',
        priority: 'high',
        status: 'pending'
      },
      {
        asset_id: asset[0].id,
        requested_by_user_id: user[0].id,
        description: 'Keyboard issue',
        priority: 'low',
        status: 'completed'
      }
    ]).execute();

    const input: GetRepairRequestsByUserInput = {
      user_id: user[0].id
    };

    const result = await getRepairRequestsByUser(input);

    expect(result).toHaveLength(2);
    result.forEach(request => {
      expect(request.requested_by_user_id).toEqual(user[0].id);
      expect(request.id).toBeDefined();
      expect(request.asset_id).toEqual(asset[0].id);
      expect(request.description).toBeDefined();
      expect(request.priority).toBeDefined();
      expect(request.status).toBeDefined();
      expect(request.requested_date).toBeInstanceOf(Date);
      expect(request.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when user has no repair requests', async () => {
    // Create a user but no repair requests
    const user = await db.insert(usersTable).values({
      username: 'testuser2',
      email: 'test2@example.com',
      role: 'regular',
      department: 'HR'
    }).returning().execute();

    const input: GetRepairRequestsByUserInput = {
      user_id: user[0].id
    };

    const result = await getRepairRequestsByUser(input);

    expect(result).toHaveLength(0);
  });

  it('should only return requests for specified user', async () => {
    // Create two users
    const user1 = await db.insert(usersTable).values({
      username: 'user1',
      email: 'user1@example.com',
      role: 'regular',
      department: 'IT'
    }).returning().execute();

    const user2 = await db.insert(usersTable).values({
      username: 'user2',
      email: 'user2@example.com',
      role: 'regular',
      department: 'IT'
    }).returning().execute();

    // Create asset
    const asset = await db.insert(assetsTable).values({
      name: 'Shared Asset',
      type: 'it_device',
      department: 'IT',
      location: 'Office B',
      serial_number: 'SHARED001',
      purchase_date: new Date(),
      status: 'active',
      assigned_user_id: null
    }).returning().execute();

    // Create repair requests for both users
    await db.insert(repairRequestsTable).values([
      {
        asset_id: asset[0].id,
        requested_by_user_id: user1[0].id,
        description: 'User 1 request',
        priority: 'medium',
        status: 'pending'
      },
      {
        asset_id: asset[0].id,
        requested_by_user_id: user2[0].id,
        description: 'User 2 request',
        priority: 'high',
        status: 'in_progress'
      }
    ]).execute();

    const input: GetRepairRequestsByUserInput = {
      user_id: user1[0].id
    };

    const result = await getRepairRequestsByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].requested_by_user_id).toEqual(user1[0].id);
    expect(result[0].description).toEqual('User 1 request');
  });
});
