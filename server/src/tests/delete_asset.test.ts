
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, usersTable } from '../db/schema';
import { type CreateAssetInput, type CreateUserInput } from '../schema';
import { deleteAsset } from '../handlers/delete_asset';
import { eq } from 'drizzle-orm';

const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  role: 'regular',
  department: 'IT'
};

const testAsset: CreateAssetInput = {
  name: 'Test Laptop',
  type: 'it_device',
  department: 'IT',
  location: 'Office A',
  serial_number: 'LAP-001',
  purchase_date: new Date('2023-01-01'),
  status: 'active',
  assigned_user_id: null
};

describe('deleteAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing asset', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create an asset
    const assetResult = await db.insert(assetsTable)
      .values({
        ...testAsset,
        assigned_user_id: userResult[0].id
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Delete the asset
    const result = await deleteAsset({ id: assetId });

    expect(result.success).toBe(true);

    // Verify asset was deleted
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent asset', async () => {
    const result = await deleteAsset({ id: 99999 });

    expect(result.success).toBe(false);
  });

  it('should not affect other assets when deleting one', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create two assets
    const asset1Result = await db.insert(assetsTable)
      .values({
        ...testAsset,
        serial_number: 'LAP-001',
        assigned_user_id: userResult[0].id
      })
      .returning()
      .execute();

    const asset2Result = await db.insert(assetsTable)
      .values({
        ...testAsset,
        name: 'Test Desktop',
        serial_number: 'DT-001',
        assigned_user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Delete first asset
    const result = await deleteAsset({ id: asset1Result[0].id });

    expect(result.success).toBe(true);

    // Verify first asset is deleted
    const deletedAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset1Result[0].id))
      .execute();

    expect(deletedAssets).toHaveLength(0);

    // Verify second asset still exists
    const remainingAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset2Result[0].id))
      .execute();

    expect(remainingAssets).toHaveLength(1);
    expect(remainingAssets[0].name).toEqual('Test Desktop');
  });
});
