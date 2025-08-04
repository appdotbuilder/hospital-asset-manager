
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { repairHistoryTable, assetsTable, usersTable } from '../db/schema';
import { type CreateRepairHistoryInput } from '../schema';
import { createRepairHistory } from '../handlers/create_repair_history';
import { eq } from 'drizzle-orm';

describe('createRepairHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testAssetId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'IT'
      })
      .returning()
      .execute();

    // Create a test asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Equipment',
        type: 'medical_equipment',
        department: 'IT',
        location: 'Room 101',
        serial_number: 'TEST-001',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: userResult[0].id
      })
      .returning()
      .execute();

    testAssetId = assetResult[0].id;
  });

  const testInput: CreateRepairHistoryInput = {
    asset_id: 0, // Will be set in test
    repair_date: new Date('2024-01-15'),
    description: 'Replaced broken component',
    cost: 299.99,
    technician: 'John Smith'
  };

  it('should create a repair history entry', async () => {
    const input = { ...testInput, asset_id: testAssetId };
    const result = await createRepairHistory(input);

    // Basic field validation
    expect(result.asset_id).toEqual(testAssetId);
    expect(result.repair_date).toEqual(new Date('2024-01-15'));
    expect(result.description).toEqual('Replaced broken component');
    expect(result.cost).toEqual(299.99);
    expect(typeof result.cost).toBe('number');
    expect(result.technician).toEqual('John Smith');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save repair history to database', async () => {
    const input = { ...testInput, asset_id: testAssetId };
    const result = await createRepairHistory(input);

    // Query using proper drizzle syntax
    const repairHistories = await db.select()
      .from(repairHistoryTable)
      .where(eq(repairHistoryTable.id, result.id))
      .execute();

    expect(repairHistories).toHaveLength(1);
    expect(repairHistories[0].asset_id).toEqual(testAssetId);
    expect(repairHistories[0].description).toEqual('Replaced broken component');
    expect(parseFloat(repairHistories[0].cost)).toEqual(299.99);
    expect(repairHistories[0].technician).toEqual('John Smith');
    expect(repairHistories[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent asset', async () => {
    const input = { ...testInput, asset_id: 99999 };

    await expect(createRepairHistory(input)).rejects.toThrow(/Asset with id 99999 not found/i);
  });

  it('should handle decimal cost values correctly', async () => {
    const input = { 
      ...testInput, 
      asset_id: testAssetId,
      cost: 1234.56
    };
    const result = await createRepairHistory(input);

    expect(result.cost).toEqual(1234.56);
    expect(typeof result.cost).toBe('number');

    // Verify in database
    const stored = await db.select()
      .from(repairHistoryTable)
      .where(eq(repairHistoryTable.id, result.id))
      .execute();

    expect(parseFloat(stored[0].cost)).toEqual(1234.56);
  });
});
