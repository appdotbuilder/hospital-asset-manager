
import { z } from 'zod';
import { db } from '../db';
import { repairHistoryTable } from '../db/schema';
import { type RepairHistory } from '../schema';
import { eq } from 'drizzle-orm';

const getRepairHistoryByAssetInputSchema = z.object({
    asset_id: z.number()
});

export type GetRepairHistoryByAssetInput = z.infer<typeof getRepairHistoryByAssetInputSchema>;

export async function getRepairHistoryByAsset(input: GetRepairHistoryByAssetInput): Promise<RepairHistory[]> {
    try {
        const results = await db.select()
            .from(repairHistoryTable)
            .where(eq(repairHistoryTable.asset_id, input.asset_id))
            .execute();

        // Convert numeric fields back to numbers
        return results.map(record => ({
            ...record,
            cost: parseFloat(record.cost) // Convert string back to number
        }));
    } catch (error) {
        console.error('Failed to fetch repair history:', error);
        throw error;
    }
}
