
import { db } from '../db';
import { repairHistoryTable, assetsTable } from '../db/schema';
import { type CreateRepairHistoryInput, type RepairHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const createRepairHistory = async (input: CreateRepairHistoryInput): Promise<RepairHistory> => {
  try {
    // Verify the asset exists to prevent foreign key constraint violations
    const asset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.asset_id))
      .execute();

    if (asset.length === 0) {
      throw new Error(`Asset with id ${input.asset_id} not found`);
    }

    // Insert repair history record
    const result = await db.insert(repairHistoryTable)
      .values({
        asset_id: input.asset_id,
        repair_date: input.repair_date,
        description: input.description,
        cost: input.cost.toString(), // Convert number to string for numeric column
        technician: input.technician
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const repairHistory = result[0];
    return {
      ...repairHistory,
      cost: parseFloat(repairHistory.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Repair history creation failed:', error);
    throw error;
  }
};
