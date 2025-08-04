
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable, repairHistoryTable } from '../db/schema';
import { type CreateRepairHistoryInput } from '../schema';
import { getRepairHistoryByAsset } from '../handlers/get_repair_history_by_asset';

// Test data
const testUser = {
    username: 'test_user',
    email: 'test@example.com',
    role: 'regular' as const,
    department: 'IT'
};

const testAsset = {
    name: 'Test Equipment',
    type: 'it_device' as const,
    department: 'IT',
    location: 'Room 101',
    serial_number: 'TEST001',
    purchase_date: new Date('2024-01-01'),
    status: 'active' as const,
    assigned_user_id: null
};

const testRepairHistory: CreateRepairHistoryInput = {
    asset_id: 1, // Will be updated after asset creation
    repair_date: new Date('2024-01-15'),
    description: 'Replaced hard drive',
    cost: 150.75,
    technician: 'John Smith'
};

const testRepairHistory2: CreateRepairHistoryInput = {
    asset_id: 1, // Will be updated after asset creation
    repair_date: new Date('2024-02-20'),
    description: 'Updated software',
    cost: 0,
    technician: 'Jane Doe'
};

describe('getRepairHistoryByAsset', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return repair history for an asset', async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values(testUser)
            .returning()
            .execute();

        // Create test asset
        const assetResult = await db.insert(assetsTable)
            .values({
                ...testAsset,
                assigned_user_id: userResult[0].id
            })
            .returning()
            .execute();

        // Create repair history records
        await db.insert(repairHistoryTable)
            .values([
                {
                    ...testRepairHistory,
                    asset_id: assetResult[0].id,
                    cost: testRepairHistory.cost.toString()
                },
                {
                    ...testRepairHistory2,
                    asset_id: assetResult[0].id,
                    cost: testRepairHistory2.cost.toString()
                }
            ])
            .execute();

        const result = await getRepairHistoryByAsset({ asset_id: assetResult[0].id });

        expect(result).toHaveLength(2);
        
        // Verify first repair record
        const firstRepair = result.find(r => r.description === 'Replaced hard drive');
        expect(firstRepair).toBeDefined();
        expect(firstRepair!.asset_id).toEqual(assetResult[0].id);
        expect(firstRepair!.cost).toEqual(150.75);
        expect(typeof firstRepair!.cost).toBe('number');
        expect(firstRepair!.technician).toEqual('John Smith');
        expect(firstRepair!.repair_date).toBeInstanceOf(Date);

        // Verify second repair record
        const secondRepair = result.find(r => r.description === 'Updated software');
        expect(secondRepair).toBeDefined();
        expect(secondRepair!.cost).toEqual(0);
        expect(typeof secondRepair!.cost).toBe('number');
        expect(secondRepair!.technician).toEqual('Jane Doe');
    });

    it('should return empty array for asset with no repair history', async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values(testUser)
            .returning()
            .execute();

        // Create test asset but no repair history
        const assetResult = await db.insert(assetsTable)
            .values({
                ...testAsset,
                assigned_user_id: userResult[0].id
            })
            .returning()
            .execute();

        const result = await getRepairHistoryByAsset({ asset_id: assetResult[0].id });

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for non-existent asset', async () => {
        const result = await getRepairHistoryByAsset({ asset_id: 999 });

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should only return repair history for specified asset', async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values(testUser)
            .returning()
            .execute();

        // Create two test assets
        const asset1Result = await db.insert(assetsTable)
            .values({
                ...testAsset,
                serial_number: 'TEST001',
                assigned_user_id: userResult[0].id
            })
            .returning()
            .execute();

        const asset2Result = await db.insert(assetsTable)
            .values({
                ...testAsset,
                serial_number: 'TEST002',
                assigned_user_id: userResult[0].id
            })
            .returning()
            .execute();

        // Create repair history for both assets
        await db.insert(repairHistoryTable)
            .values([
                {
                    ...testRepairHistory,
                    asset_id: asset1Result[0].id,
                    cost: testRepairHistory.cost.toString(),
                    description: 'Asset 1 repair'
                },
                {
                    ...testRepairHistory2,
                    asset_id: asset2Result[0].id,
                    cost: testRepairHistory2.cost.toString(),
                    description: 'Asset 2 repair'
                }
            ])
            .execute();

        // Get repair history for asset 1 only
        const result = await getRepairHistoryByAsset({ asset_id: asset1Result[0].id });

        expect(result).toHaveLength(1);
        expect(result[0].description).toEqual('Asset 1 repair');
        expect(result[0].asset_id).toEqual(asset1Result[0].id);
    });
});
