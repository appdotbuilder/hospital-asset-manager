
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { repairRequestsTable, usersTable, assetsTable } from '../db/schema';
import { type CreateRepairRequestInput } from '../schema';
import { createRepairRequest } from '../handlers/create_repair_request';
import { eq } from 'drizzle-orm';

describe('createRepairRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testAssetId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'IT'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Laptop',
        type: 'it_device',
        department: 'IT',
        location: 'Office 101',
        serial_number: 'TEST123',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: testUserId
      })
      .returning()
      .execute();
    testAssetId = assetResult[0].id;
  });

  const testInput: CreateRepairRequestInput = {
    asset_id: 0, // Will be set in tests
    requested_by_user_id: 0, // Will be set in tests
    description: 'Screen is flickering and needs repair',
    priority: 'high'
  };

  it('should create a repair request', async () => {
    const input = {
      ...testInput,
      asset_id: testAssetId,
      requested_by_user_id: testUserId
    };

    const result = await createRepairRequest(input);

    expect(result.asset_id).toEqual(testAssetId);
    expect(result.requested_by_user_id).toEqual(testUserId);
    expect(result.description).toEqual('Screen is flickering and needs repair');
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('pending');
    expect(result.requested_date).toBeInstanceOf(Date);
    expect(result.completed_date).toBeNull();
    expect(result.admin_notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save repair request to database', async () => {
    const input = {
      ...testInput,
      asset_id: testAssetId,
      requested_by_user_id: testUserId
    };

    const result = await createRepairRequest(input);

    const repairRequests = await db.select()
      .from(repairRequestsTable)
      .where(eq(repairRequestsTable.id, result.id))
      .execute();

    expect(repairRequests).toHaveLength(1);
    expect(repairRequests[0].asset_id).toEqual(testAssetId);
    expect(repairRequests[0].requested_by_user_id).toEqual(testUserId);
    expect(repairRequests[0].description).toEqual('Screen is flickering and needs repair');
    expect(repairRequests[0].priority).toEqual('high');
    expect(repairRequests[0].status).toEqual('pending');
    expect(repairRequests[0].requested_date).toBeInstanceOf(Date);
    expect(repairRequests[0].completed_date).toBeNull();
    expect(repairRequests[0].admin_notes).toBeNull();
  });

  it('should throw error when asset does not exist', async () => {
    const input = {
      ...testInput,
      asset_id: 99999, // Non-existent asset ID
      requested_by_user_id: testUserId
    };

    await expect(createRepairRequest(input)).rejects.toThrow(/Asset with id 99999 not found/i);
  });

  it('should throw error when user does not exist', async () => {
    const input = {
      ...testInput,
      asset_id: testAssetId,
      requested_by_user_id: 99999 // Non-existent user ID
    };

    await expect(createRepairRequest(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should create repair request with different priorities', async () => {
    const lowPriorityInput = {
      ...testInput,
      asset_id: testAssetId,
      requested_by_user_id: testUserId,
      priority: 'low',
      description: 'Minor cosmetic issue'
    };

    const result = await createRepairRequest(lowPriorityInput);

    expect(result.priority).toEqual('low');
    expect(result.description).toEqual('Minor cosmetic issue');
    expect(result.status).toEqual('pending');
  });
});
