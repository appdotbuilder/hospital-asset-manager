
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, usersTable } from '../db/schema';
import { type CreateAssetInput, type CreateUserInput } from '../schema';
import { createAsset } from '../handlers/create_asset';
import { eq } from 'drizzle-orm';

// Test user for assignment
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  role: 'regular',
  department: 'IT'
};

// Test asset input
const testAssetInput: CreateAssetInput = {
  name: 'Test Laptop',
  type: 'it_device',
  department: 'IT',
  location: 'Office 101',
  serial_number: 'LAP-001',
  purchase_date: new Date('2024-01-15'),
  status: 'active',
  assigned_user_id: null
};

describe('createAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an asset without assigned user', async () => {
    const result = await createAsset(testAssetInput);

    // Basic field validation
    expect(result.name).toEqual('Test Laptop');
    expect(result.type).toEqual('it_device');
    expect(result.department).toEqual('IT');
    expect(result.location).toEqual('Office 101');
    expect(result.serial_number).toEqual('LAP-001');
    expect(result.purchase_date).toEqual(testAssetInput.purchase_date);
    expect(result.status).toEqual('active');
    expect(result.assigned_user_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an asset with assigned user', async () => {
    // Create user first
    const user = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const assetWithUser: CreateAssetInput = {
      ...testAssetInput,
      assigned_user_id: user[0].id
    };

    const result = await createAsset(assetWithUser);

    expect(result.assigned_user_id).toEqual(user[0].id);
    expect(result.name).toEqual('Test Laptop');
    expect(result.type).toEqual('it_device');
  });

  it('should save asset to database', async () => {
    const result = await createAsset(testAssetInput);

    // Query asset from database
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Test Laptop');
    expect(assets[0].type).toEqual('it_device');
    expect(assets[0].department).toEqual('IT');
    expect(assets[0].serial_number).toEqual('LAP-001');
    expect(assets[0].created_at).toBeInstanceOf(Date);
    expect(assets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when assigned user does not exist', async () => {
    const assetWithInvalidUser: CreateAssetInput = {
      ...testAssetInput,
      assigned_user_id: 999
    };

    await expect(createAsset(assetWithInvalidUser))
      .rejects.toThrow(/User with id 999 does not exist/i);
  });

  it('should enforce unique serial number constraint', async () => {
    // Create first asset
    await createAsset(testAssetInput);

    // Try to create second asset with same serial number
    const duplicateAsset: CreateAssetInput = {
      ...testAssetInput,
      name: 'Another Laptop'
    };

    await expect(createAsset(duplicateAsset))
      .rejects.toThrow();
  });
});
