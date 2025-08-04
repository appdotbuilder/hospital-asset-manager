
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, usersTable } from '../db/schema';
import { type UpdateAssetInput, type CreateUserInput, type CreateAssetInput } from '../schema';
import { updateAsset } from '../handlers/update_asset';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  department: 'IT'
};

// Test asset data
const testAsset: CreateAssetInput = {
  name: 'Test Equipment',
  type: 'medical_equipment',
  department: 'Health',
  location: 'Room 101',
  serial_number: 'TEST001',
  purchase_date: new Date('2023-01-01'),
  status: 'active',
  assigned_user_id: null
};

describe('updateAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update asset with all fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values(testAsset)
      .returning()
      .execute();
    const assetId = assetResult[0].id;

    // Update asset
    const updateInput: UpdateAssetInput = {
      id: assetId,
      name: 'Updated Equipment',
      type: 'it_device',
      department: 'Updated Dept',
      location: 'Room 202',
      serial_number: 'UPDATED001',
      purchase_date: new Date('2024-01-01'),
      status: 'under_repair',
      assigned_user_id: userId
    };

    const result = await updateAsset(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(assetId);
    expect(result.name).toEqual('Updated Equipment');
    expect(result.type).toEqual('it_device');
    expect(result.department).toEqual('Updated Dept');
    expect(result.location).toEqual('Room 202');
    expect(result.serial_number).toEqual('UPDATED001');
    expect(result.purchase_date).toEqual(new Date('2024-01-01'));
    expect(result.status).toEqual('under_repair');
    expect(result.assigned_user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update asset with partial fields', async () => {
    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values(testAsset)
      .returning()
      .execute();
    const assetId = assetResult[0].id;

    // Update only name and status
    const updateInput: UpdateAssetInput = {
      id: assetId,
      name: 'Partially Updated',
      status: 'damaged'
    };

    const result = await updateAsset(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated');
    expect(result.status).toEqual('damaged');
    // Verify unchanged fields
    expect(result.type).toEqual(testAsset.type);
    expect(result.department).toEqual(testAsset.department);
    expect(result.location).toEqual(testAsset.location);
    expect(result.serial_number).toEqual(testAsset.serial_number);
    expect(result.assigned_user_id).toEqual(testAsset.assigned_user_id);
  });

  it('should save updated asset to database', async () => {
    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values(testAsset)
      .returning()
      .execute();
    const assetId = assetResult[0].id;

    const updateInput: UpdateAssetInput = {
      id: assetId,
      name: 'Database Updated',
      status: 'inactive'
    };

    await updateAsset(updateInput);

    // Query database to verify changes
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Updated');
    expect(assets[0].status).toEqual('inactive');
    expect(assets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values(testAsset)
      .returning()
      .execute();
    const assetId = assetResult[0].id;
    const originalUpdatedAt = assetResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateAssetInput = {
      id: assetId,
      name: 'Timestamp Test'
    };

    const result = await updateAsset(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent asset', async () => {
    const updateInput: UpdateAssetInput = {
      id: 99999,
      name: 'Non-existent Asset'
    };

    await expect(updateAsset(updateInput)).rejects.toThrow(/Asset with id 99999 not found/i);
  });

  it('should handle null assigned_user_id', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create asset assigned to user
    const assetWithUser = {
      ...testAsset,
      assigned_user_id: userId
    };

    const assetResult = await db.insert(assetsTable)
      .values(assetWithUser)
      .returning()
      .execute();
    const assetId = assetResult[0].id;

    // Update to unassign user
    const updateInput: UpdateAssetInput = {
      id: assetId,
      assigned_user_id: null
    };

    const result = await updateAsset(updateInput);

    expect(result.assigned_user_id).toBeNull();
  });
});
