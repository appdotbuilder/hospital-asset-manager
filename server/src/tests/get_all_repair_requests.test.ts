
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable, repairRequestsTable } from '../db/schema';
import { getAllRepairRequests } from '../handlers/get_all_repair_requests';

describe('getAllRepairRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no repair requests exist', async () => {
    const result = await getAllRepairRequests();
    expect(result).toEqual([]);
  });

  it('should return all repair requests ordered by created_at desc', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'IT'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Equipment',
        type: 'it_device',
        department: 'IT',
        location: 'Office A',
        serial_number: 'TEST123',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: userId
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Create multiple repair requests with different timestamps
    const firstRequest = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetId,
        requested_by_user_id: userId,
        description: 'First repair request',
        priority: 'high',
        status: 'pending'
      })
      .returning()
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondRequest = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetId,
        requested_by_user_id: userId,
        description: 'Second repair request',
        priority: 'medium',
        status: 'in_progress'
      })
      .returning()
      .execute();

    const result = await getAllRepairRequests();

    expect(result).toHaveLength(2);
    
    // Verify ordering - most recent first
    expect(result[0].description).toEqual('Second repair request');
    expect(result[1].description).toEqual('First repair request');

    // Verify all fields are present
    result.forEach(request => {
      expect(request.id).toBeDefined();
      expect(request.asset_id).toEqual(assetId);
      expect(request.requested_by_user_id).toEqual(userId);
      expect(request.description).toBeDefined();
      expect(request.priority).toBeDefined();
      expect(request.status).toBeDefined();
      expect(request.requested_date).toBeInstanceOf(Date);
      expect(request.completed_date).toBeNull();
      expect(request.admin_notes).toBeNull();
      expect(request.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return repair requests with all status types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'Maintenance'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Medical Device',
        type: 'medical_equipment',
        department: 'Maintenance',
        location: 'Room B',
        serial_number: 'MED456',
        purchase_date: new Date('2022-06-01'),
        status: 'under_repair',
        assigned_user_id: userId
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Create requests with different statuses
    const statuses = ['pending', 'in_progress', 'completed', 'rejected'] as const;
    
    for (const status of statuses) {
      await db.insert(repairRequestsTable)
        .values({
          asset_id: assetId,
          requested_by_user_id: userId,
          description: `Request with ${status} status`,
          priority: 'low',
          status: status,
          completed_date: status === 'completed' ? new Date() : null,
          admin_notes: status === 'rejected' ? 'Not necessary' : null
        })
        .execute();
    }

    const result = await getAllRepairRequests();

    expect(result).toHaveLength(4);

    // Verify all status types are present
    const returnedStatuses = result.map(r => r.status).sort();
    expect(returnedStatuses).toEqual(['completed', 'in_progress', 'pending', 'rejected']);

    // Verify completed request has completed_date
    const completedRequest = result.find(r => r.status === 'completed');
    expect(completedRequest?.completed_date).toBeInstanceOf(Date);

    // Verify rejected request has admin_notes
    const rejectedRequest = result.find(r => r.status === 'rejected');
    expect(rejectedRequest?.admin_notes).toEqual('Not necessary');
  });
});
