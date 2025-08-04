
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable } from '../db/schema';
import { type CreateUserInput, type CreateAssetInput, type GetUserAssetsInput } from '../schema';
import { getUserAssets } from '../handlers/get_user_assets';

// Test users
const testUser1: CreateUserInput = {
  username: 'testuser1',
  email: 'test1@example.com',
  role: 'regular',
  department: 'IT'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  role: 'regular',
  department: 'Medical'
};

describe('getUserAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return assets assigned to a specific user', async () => {
    // Create test users
    const [user1, user2] = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test assets
    const testAssets: CreateAssetInput[] = [
      {
        name: 'Laptop 1',
        type: 'it_device',
        department: 'IT',
        location: 'Office 1',
        serial_number: 'LP001',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: user1.id
      },
      {
        name: 'Monitor 1',
        type: 'it_device',
        department: 'IT',
        location: 'Office 1',
        serial_number: 'MN001',
        purchase_date: new Date('2023-01-02'),
        status: 'active',
        assigned_user_id: user1.id
      },
      {
        name: 'Desk 1',
        type: 'furniture',
        department: 'Medical',
        location: 'Room 201',
        serial_number: 'DS001',
        purchase_date: new Date('2023-01-03'),
        status: 'active',
        assigned_user_id: user2.id
      }
    ];

    await db.insert(assetsTable)
      .values(testAssets)
      .execute();

    const input: GetUserAssetsInput = { user_id: user1.id };
    const result = await getUserAssets(input);

    // Should return only assets assigned to user1
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Laptop 1');
    expect(result[0].assigned_user_id).toEqual(user1.id);
    expect(result[1].name).toEqual('Monitor 1');
    expect(result[1].assigned_user_id).toEqual(user1.id);
  });

  it('should return empty array when user has no assigned assets', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create asset assigned to no one
    const testAsset: CreateAssetInput = {
      name: 'Unassigned Laptop',
      type: 'it_device',
      department: 'IT',
      location: 'Storage',
      serial_number: 'UL001',
      purchase_date: new Date('2023-01-01'),
      status: 'inactive',
      assigned_user_id: null
    };

    await db.insert(assetsTable)
      .values([testAsset])
      .execute();

    const input: GetUserAssetsInput = { user_id: user.id };
    const result = await getUserAssets(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserAssetsInput = { user_id: 999 };
    const result = await getUserAssets(input);

    expect(result).toHaveLength(0);
  });

  it('should return assets with all required fields', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create test asset
    const testAsset: CreateAssetInput = {
      name: 'Test Equipment',
      type: 'medical_equipment',
      department: 'Medical',
      location: 'Room 101',
      serial_number: 'ME001',
      purchase_date: new Date('2023-01-01'),
      status: 'active',
      assigned_user_id: user.id
    };

    await db.insert(assetsTable)
      .values([testAsset])
      .execute();

    const input: GetUserAssetsInput = { user_id: user.id };
    const result = await getUserAssets(input);

    expect(result).toHaveLength(1);
    const asset = result[0];
    
    expect(asset.id).toBeDefined();
    expect(asset.name).toEqual('Test Equipment');
    expect(asset.type).toEqual('medical_equipment');
    expect(asset.department).toEqual('Medical');
    expect(asset.location).toEqual('Room 101');
    expect(asset.serial_number).toEqual('ME001');
    expect(asset.purchase_date).toBeInstanceOf(Date);
    expect(asset.status).toEqual('active');
    expect(asset.assigned_user_id).toEqual(user.id);
    expect(asset.created_at).toBeInstanceOf(Date);
    expect(asset.updated_at).toBeInstanceOf(Date);
  });
});
